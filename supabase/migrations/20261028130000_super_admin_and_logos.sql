-- =============================================================================
-- Platform super admin + organization logos.
--
-- Super admin:
--   * `platform_admins` lists who runs the platform. No RLS policies on it, so
--     it can only be changed from the SQL editor / service role, never from the app.
--   * Super admins do NOT get row access to tenants' business data. They only see
--     aggregated stats and the organization directory through the two SECURITY
--     DEFINER functions below, which check is_super_admin() first.
--
-- Logos:
--   * organizations.logo_url + public bucket `org-logos` (max 2 MB, png/jpeg/webp).
--   * Files live under `<organization_id>/…`; only that org's admins can write.
--
-- Single transaction. Apply in Supabase → SQL Editor.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Super admins
-- -----------------------------------------------------------------------------
create table public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Platform stats (aggregates only)
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
    'users',                  (select count(*) from public.profiles where organization_id is not null),
    'users_by_role',          (select coalesce(json_object_agg(role, n), '{}'::json)
                               from (select role, count(*) n from public.profiles
                                     where organization_id is not null group by role) r),
    'work_orders',            (select count(*) from public.work_orders),
    'work_orders_completed',  (select count(*) from public.work_orders where status = 'completada'),
    'assets',                 (select count(*) from public.assets),
    'clients',                (select count(*) from public.clients),
    'signups_by_week',        (select coalesce(json_agg(json_build_object('week', week, 'count', n) order by week), '[]'::json)
                               from (select date_trunc('week', created_at)::date as week, count(*) as n
                                     from public.organizations
                                     where created_at >= date_trunc('week', now()) - interval '11 weeks'
                                     group by 1) w)
  );
end $$;

revoke execute on function public.platform_stats() from public, anon;
grant execute on function public.platform_stats() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Organization directory (one row per company, with usage counts)
-- -----------------------------------------------------------------------------
alter table public.organizations add column logo_url text;

create or replace function public.platform_organizations()
returns table (
  id          uuid,
  name        text,
  logo_url    text,
  created_at  timestamptz,
  admin_name  text,
  admin_email text,
  users       bigint,
  clients     bigint,
  assets      bigint,
  work_orders bigint
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
    o.created_at,
    adm.full_name,
    adm.email::text,
    (select count(*) from public.profiles p where p.organization_id = o.id),
    (select count(*) from public.clients c where c.organization_id = o.id),
    (select count(*) from public.assets a where a.organization_id = o.id),
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

-- -----------------------------------------------------------------------------
-- 4. Logo storage
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-logos', 'org-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Public bucket: anyone with the URL can view a logo (they are not sensitive).
-- Writes are limited to admins, inside their own organization's folder.
create policy "Org admins read their logo folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = (select public.my_org_id())::text
  );

create policy "Org admins upload their logo" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = (select public.my_org_id())::text
    and (select public.my_role()) = 'admin'
  );

create policy "Org admins update their logo" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = (select public.my_org_id())::text
    and (select public.my_role()) = 'admin'
  );

create policy "Org admins delete their logo" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = (select public.my_org_id())::text
    and (select public.my_role()) = 'admin'
  );

commit;

-- =============================================================================
-- After applying, make yourself super admin (replace the email):
--
--   insert into public.platform_admins (user_id)
--   select id from auth.users where email = 'tu-correo@ejemplo.com';
-- =============================================================================
