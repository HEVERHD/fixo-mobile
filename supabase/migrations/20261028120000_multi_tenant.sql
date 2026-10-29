-- =============================================================================
-- Multi-tenant: one organization per contractor company.
--
-- * Adds `organizations` and `organization_id` on every business table.
-- * Moves existing rows into a first organization.
-- * Replaces every RLS policy with org-scoped, role-aware policies.
-- * Closes privilege-escalation holes in the previous policies:
--     - users could update their own `role` (profiles)
--     - assets / maintenance_records were readable by anyone (`using (true)`)
--     - operators could change any column of their work orders
--     - clients could change any column of their quotes (e.g. total)
-- * Rewrites handle_new_user() so new users land in the right organization.
--
-- Runs in a single transaction: if anything fails, nothing is applied.
-- Apply in Supabase → SQL Editor, or with `supabase db push`.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Organizations
-- -----------------------------------------------------------------------------
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  nit        text,
  created_at timestamptz not null default now()
);
alter table public.organizations enable row level security;
revoke all on public.organizations from anon;
grant select, update on public.organizations to authenticated;

-- -----------------------------------------------------------------------------
-- 2. organization_id on every table (nullable until backfilled)
-- -----------------------------------------------------------------------------
alter table public.profiles            add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.clients             add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.operators           add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.assets              add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.work_orders         add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.maintenance_records add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.apu_catalog         add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.quotes              add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.quote_items         add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.invoices            add column organization_id uuid references public.organizations(id) on delete cascade;

-- -----------------------------------------------------------------------------
-- 3. Backfill: everything that exists today goes to a first organization
-- -----------------------------------------------------------------------------
do $$
declare
  v_org uuid;
begin
  insert into public.organizations (name) values ('Mi empresa') returning id into v_org;

  update public.profiles            set organization_id = v_org where organization_id is null;
  update public.clients             set organization_id = v_org where organization_id is null;
  update public.operators           set organization_id = v_org where organization_id is null;
  update public.assets              set organization_id = v_org where organization_id is null;
  update public.work_orders         set organization_id = v_org where organization_id is null;
  update public.maintenance_records set organization_id = v_org where organization_id is null;
  update public.apu_catalog         set organization_id = v_org where organization_id is null;
  update public.quotes              set organization_id = v_org where organization_id is null;
  update public.quote_items         set organization_id = v_org where organization_id is null;
  update public.invoices            set organization_id = v_org where organization_id is null;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Helpers used by policies and defaults.
--    SECURITY DEFINER so they can read profiles without recursing into its RLS.
-- -----------------------------------------------------------------------------
create or replace function public.my_org_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_role()
returns public.user_role
language sql stable security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- -----------------------------------------------------------------------------
-- 5. Business tables: org is required and defaults to the caller's org,
--    so the app never has to send organization_id on insert.
--    profiles.organization_id stays nullable: a user created without an
--    organization (e.g. from the dashboard) simply has no access until assigned.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'operators', 'assets', 'work_orders', 'maintenance_records',
    'apu_catalog', 'quotes', 'quote_items', 'invoices'
  ] loop
    execute format('alter table public.%I alter column organization_id set not null', t);
    execute format('alter table public.%I alter column organization_id set default public.my_org_id()', t);
    execute format('create index %I on public.%I (organization_id)', t || '_organization_id_idx', t);
  end loop;
end $$;
create index profiles_organization_id_idx on public.profiles (organization_id);

-- -----------------------------------------------------------------------------
-- 6. Drop every existing policy on these tables
-- -----------------------------------------------------------------------------
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'clients', 'operators', 'assets', 'work_orders',
                        'maintenance_records', 'apu_catalog', 'quotes', 'quote_items', 'invoices')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 7. New policies. Every policy is scoped to the caller's organization.
--    `(select fn())` lets Postgres evaluate the helper once per query.
-- -----------------------------------------------------------------------------

-- organizations --------------------------------------------------------------
create policy "Members view their organization" on public.organizations
  for select to authenticated
  using (id = (select public.my_org_id()));

create policy "Admins update their organization" on public.organizations
  for update to authenticated
  using (id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (id = (select public.my_org_id()));

-- profiles -------------------------------------------------------------------
create policy "Users view own profile; admins view their org" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  );

-- Which columns may change is enforced by guard_profile_update() below.
create policy "Users update own profile; admins update their org" on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  )
  with check (
    id = (select auth.uid())
    or (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  );

-- clients --------------------------------------------------------------------
create policy "Admins manage clients" on public.clients
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

-- Operators need client name/address/contact for the jobs they go to.
create policy "Operators view clients" on public.clients
  for select to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'operario');

create policy "Clients view own record" on public.clients
  for select to authenticated
  using (organization_id = (select public.my_org_id()) and user_id = (select auth.uid()));

-- operators ------------------------------------------------------------------
create policy "Admins manage operators" on public.operators
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

create policy "Operators view operators" on public.operators
  for select to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'operario');

-- assets ---------------------------------------------------------------------
create policy "Admins manage assets" on public.assets
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

-- Operators scan QR codes of any asset of their company.
create policy "Operators view assets" on public.assets
  for select to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'operario');

create policy "Clients view own assets" on public.assets
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );

-- work_orders ----------------------------------------------------------------
create policy "Admins manage work orders" on public.work_orders
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

create policy "Operators view assigned work orders" on public.work_orders
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and assigned_operator_id in (select o.id from public.operators o where o.user_id = (select auth.uid()))
  );

-- Which columns may change is enforced by guard_work_order_update() below.
create policy "Operators update assigned work orders" on public.work_orders
  for update to authenticated
  using (
    organization_id = (select public.my_org_id())
    and assigned_operator_id in (select o.id from public.operators o where o.user_id = (select auth.uid()))
  )
  with check (
    organization_id = (select public.my_org_id())
    and assigned_operator_id in (select o.id from public.operators o where o.user_id = (select auth.uid()))
  );

create policy "Clients view own work orders" on public.work_orders
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );

-- maintenance_records --------------------------------------------------------
create policy "Admins manage maintenance records" on public.maintenance_records
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

-- Full history of the company's assets (what the QR scan shows).
create policy "Operators view maintenance records" on public.maintenance_records
  for select to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'operario');

create policy "Operators create own maintenance records" on public.maintenance_records
  for insert to authenticated
  with check (
    organization_id = (select public.my_org_id())
    and operator_id in (select o.id from public.operators o where o.user_id = (select auth.uid()))
  );

create policy "Operators update own maintenance records" on public.maintenance_records
  for update to authenticated
  using (
    organization_id = (select public.my_org_id())
    and operator_id in (select o.id from public.operators o where o.user_id = (select auth.uid()))
  )
  with check (
    organization_id = (select public.my_org_id())
    and operator_id in (select o.id from public.operators o where o.user_id = (select auth.uid()))
  );

create policy "Clients view maintenance of own assets" on public.maintenance_records
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and asset_id in (
      select a.id from public.assets a
      join public.clients c on c.id = a.client_id
      where c.user_id = (select auth.uid())
    )
  );

-- apu_catalog: internal costs, not visible to clients -----------------------
create policy "Admins manage APU catalog" on public.apu_catalog
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

create policy "Operators view APU catalog" on public.apu_catalog
  for select to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'operario');

-- quotes ---------------------------------------------------------------------
create policy "Admins manage quotes" on public.quotes
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

create policy "Clients view own quotes" on public.quotes
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );

-- Only approve/reject is allowed; enforced by guard_quote_update() below.
create policy "Clients answer own quotes" on public.quotes
  for update to authenticated
  using (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  )
  with check (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );

-- quote_items ----------------------------------------------------------------
create policy "Admins manage quote items" on public.quote_items
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

create policy "Clients view items of own quotes" on public.quote_items
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and quote_id in (
      select q.id from public.quotes q
      join public.clients c on c.id = q.client_id
      where c.user_id = (select auth.uid())
    )
  );

-- invoices -------------------------------------------------------------------
create policy "Admins manage invoices" on public.invoices
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

create policy "Clients view own invoices" on public.invoices
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- 8. Column guards. RLS decides *which rows* a user may update; these triggers
--    decide *which columns*. Server-side calls (SQL editor, service role) have
--    no auth.uid() and are not restricted.
-- -----------------------------------------------------------------------------

-- profiles: users edit only their personal fields; admins may change role
-- within their org; nobody moves a user to another org from the app.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.organization_id is distinct from old.organization_id then
    raise exception 'No se puede cambiar la organización de un usuario' using errcode = '42501';
  end if;

  if public.my_role() = 'admin' and old.organization_id = public.my_org_id() then
    return new;
  end if;

  if (to_jsonb(new) - array['full_name', 'phone', 'avatar_url'])
     is distinct from (to_jsonb(old) - array['full_name', 'phone', 'avatar_url']) then
    raise exception 'Solo puedes modificar tu nombre, teléfono y foto' using errcode = '42501';
  end if;

  return new;
end $$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- work_orders: operators only move their order forward and add notes.
create or replace function public.guard_work_order_update()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.status = 'completada' and old.status <> 'completada' and new.completed_date is null then
    new.completed_date := current_date;
  end if;

  if auth.uid() is null or public.my_role() = 'admin' then
    return new;
  end if;

  if (to_jsonb(new) - array['status', 'notes', 'completed_date'])
     is distinct from (to_jsonb(old) - array['status', 'notes', 'completed_date']) then
    raise exception 'Solo puedes cambiar el estado y las notas de la orden' using errcode = '42501';
  end if;

  if new.status is distinct from old.status and not (
    (old.status = 'pendiente' and new.status = 'en_proceso')
    or (old.status = 'en_proceso' and new.status = 'completada')
  ) then
    raise exception 'Cambio de estado no permitido: % → %', old.status, new.status using errcode = '42501';
  end if;

  return new;
end $$;

create trigger guard_work_order_update
  before update on public.work_orders
  for each row execute function public.guard_work_order_update();

-- quotes: clients only approve or reject a quote that was sent to them.
create or replace function public.guard_quote_update()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.my_role() = 'admin' then
    return new;
  end if;

  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Solo puedes aprobar o rechazar la cotización' using errcode = '42501';
  end if;

  if not (old.status = 'enviada' and new.status in ('aprobada', 'rechazada')) then
    raise exception 'La cotización no se puede responder en su estado actual' using errcode = '42501';
  end if;

  return new;
end $$;

create trigger guard_quote_update
  before update on public.quotes
  for each row execute function public.guard_quote_update();

-- -----------------------------------------------------------------------------
-- 9. New users
--   a) Invited by an admin (server side, service role): app_metadata carries
--      organization_id and role. app_metadata cannot be edited by the user.
--   b) Public sign-up with user_metadata.organization_name: creates a new
--      organization and the user becomes its admin.
--   c) Anything else (e.g. created from the dashboard): profile without
--      organization → no access until an admin/SQL assigns one.
--   The role is never taken from user_metadata (user-controlled).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_org  uuid;
  v_role public.user_role := 'cliente';
begin
  if new.raw_app_meta_data ? 'organization_id' then
    v_org  := (new.raw_app_meta_data ->> 'organization_id')::uuid;
    v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'cliente');
  elsif coalesce(trim(new.raw_user_meta_data ->> 'organization_name'), '') <> '' then
    insert into public.organizations (name)
    values (trim(new.raw_user_meta_data ->> 'organization_name'))
    returning id into v_org;
    v_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, role, organization_id)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    v_role,
    v_org
  );

  return new;
end $$;

commit;

-- =============================================================================
-- Post-checks (run separately after applying):
--
--   select id, name from public.organizations;
--   select id, full_name, role, organization_id from public.profiles;
--   select tablename, count(*) from pg_policies where schemaname = 'public' group by 1 order by 1;
-- =============================================================================
