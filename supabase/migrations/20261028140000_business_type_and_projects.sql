-- =============================================================================
-- Business type per organization + projects ("Obras").
--
-- * organizations.business_type: mantenimiento | construccion | ambos.
--   Chosen at sign-up, editable by the org admin. The app uses it to decide
--   which tabs and dashboard widgets to show; the data model is the same for all.
-- * projects: a job site / contract that groups work orders and quotes.
--   Optional for maintenance companies, central for construction companies.
-- * handle_new_user() now stores the business type chosen at sign-up.
-- * platform_stats()/platform_organizations() include the business type.
--
-- Single transaction. Apply in Supabase → SQL Editor.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Business type
-- -----------------------------------------------------------------------------
create type public.business_type as enum ('mantenimiento', 'construccion', 'ambos');

alter table public.organizations
  add column business_type public.business_type not null default 'mantenimiento';

-- -----------------------------------------------------------------------------
-- 2. Projects (obras)
-- -----------------------------------------------------------------------------
create type public.project_status as enum ('planeacion', 'en_ejecucion', 'pausada', 'terminada');

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.my_org_id()
                  references public.organizations(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete restrict,
  name            text not null,
  address         text,
  latitude        double precision,   -- job site location, for GPS check-in later
  longitude       double precision,
  start_date      date,
  end_date        date,
  budget          numeric(14, 2),
  progress        smallint not null default 0 check (progress between 0 and 100),
  status          public.project_status not null default 'planeacion',
  notes           text,
  created_at      timestamptz not null default now()
);
create index projects_organization_id_idx on public.projects (organization_id);
create index projects_client_id_idx on public.projects (client_id);

alter table public.projects enable row level security;

create policy "Admins manage projects" on public.projects
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin');

create policy "Operators view projects" on public.projects
  for select to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'operario');

create policy "Clients view own projects" on public.projects
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );

-- Work orders and quotes can belong to a project
alter table public.work_orders add column project_id uuid references public.projects(id) on delete set null;
alter table public.quotes      add column project_id uuid references public.projects(id) on delete set null;
create index work_orders_project_id_idx on public.work_orders (project_id);
create index quotes_project_id_idx on public.quotes (project_id);

-- -----------------------------------------------------------------------------
-- 3. Sign-up stores the business type (user_metadata.business_type)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_org  uuid;
  v_role public.user_role := 'cliente';
  v_type public.business_type := 'mantenimiento';
begin
  if new.raw_app_meta_data ? 'organization_id' then
    v_org  := (new.raw_app_meta_data ->> 'organization_id')::uuid;
    v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'cliente');
  elsif coalesce(trim(new.raw_user_meta_data ->> 'organization_name'), '') <> '' then
    if new.raw_user_meta_data ->> 'business_type' in ('mantenimiento', 'construccion', 'ambos') then
      v_type := (new.raw_user_meta_data ->> 'business_type')::public.business_type;
    end if;
    insert into public.organizations (name, business_type)
    values (trim(new.raw_user_meta_data ->> 'organization_name'), v_type)
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

-- -----------------------------------------------------------------------------
-- 4. Platform functions include business type and projects
-- -----------------------------------------------------------------------------
create or replace function public.platform_stats()
returns json
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return json_build_object(
    'organizations',          (select count(*) from public.organizations),
    'organizations_last_30d', (select count(*) from public.organizations where created_at >= now() - interval '30 days'),
    'organizations_by_type',  (select coalesce(json_object_agg(business_type, n), '{}'::json)
                               from (select business_type, count(*) n from public.organizations group by business_type) t),
    'users',                  (select count(*) from public.profiles where organization_id is not null),
    'users_by_role',          (select coalesce(json_object_agg(role, n), '{}'::json)
                               from (select role, count(*) n from public.profiles
                                     where organization_id is not null group by role) r),
    'work_orders',            (select count(*) from public.work_orders),
    'work_orders_completed',  (select count(*) from public.work_orders where status = 'completada'),
    'assets',                 (select count(*) from public.assets),
    'projects',               (select count(*) from public.projects),
    'clients',                (select count(*) from public.clients),
    'signups_by_week',        (select coalesce(json_agg(json_build_object('week', week, 'count', n) order by week), '[]'::json)
                               from (select date_trunc('week', created_at)::date as week, count(*) as n
                                     from public.organizations
                                     where created_at >= date_trunc('week', now()) - interval '11 weeks'
                                     group by 1) w)
  );
end $$;

-- Return type changes, so the function has to be recreated
drop function public.platform_organizations();

create function public.platform_organizations()
returns table (
  id            uuid,
  name          text,
  logo_url      text,
  business_type public.business_type,
  created_at    timestamptz,
  admin_name    text,
  admin_email   text,
  users         bigint,
  clients       bigint,
  assets        bigint,
  projects      bigint,
  work_orders   bigint
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
  select
    o.id,
    o.name,
    o.logo_url,
    o.business_type,
    o.created_at,
    adm.full_name,
    adm.email::text,
    (select count(*) from public.profiles p where p.organization_id = o.id),
    (select count(*) from public.clients c where c.organization_id = o.id),
    (select count(*) from public.assets a where a.organization_id = o.id),
    (select count(*) from public.projects pr where pr.organization_id = o.id),
    (select count(*) from public.work_orders w where w.organization_id = o.id)
  from public.organizations o
  left join lateral (
    select p.full_name, u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.organization_id = o.id and p.role = 'admin'
    order by p.created_at
    limit 1
  ) adm on true
  order by o.created_at desc;
end $$;

revoke execute on function public.platform_organizations() from public, anon;
grant execute on function public.platform_organizations() to authenticated;

commit;
