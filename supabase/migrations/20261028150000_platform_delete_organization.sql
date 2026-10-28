-- =============================================================================
-- Super admin can permanently delete an organization.
--
-- * platform_delete_organization(org_id, confirm_name):
--     - only super admins
--     - confirm_name must match the organization name exactly
--     - refuses organizations that contain a super admin (protects your own account)
--     - deletes all business data, then the members' auth users (cascades profiles)
--     - writes an entry to platform_audit_log first
-- * platform_audit_log: no RLS policies → readable only from the SQL editor.
--
-- Deletion order is explicit because several foreign keys between business
-- tables are ON DELETE RESTRICT (e.g. work_orders → clients).
-- Logo files in Storage are not removed here (see note at the end).
--
-- Single transaction. Apply in Supabase → SQL Editor.
-- =============================================================================

begin;

create table public.platform_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  action      text not null,
  target_id   uuid,
  target_name text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
alter table public.platform_audit_log enable row level security;
revoke all on public.platform_audit_log from anon, authenticated;

create or replace function public.platform_delete_organization(p_org uuid, p_confirm_name text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name    text;
  v_details jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select name into v_name from public.organizations where id = p_org for update;
  if v_name is null then
    raise exception 'La empresa no existe' using errcode = 'P0002';
  end if;

  if p_confirm_name is distinct from v_name then
    raise exception 'El nombre de confirmación no coincide' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.profiles p
    join public.platform_admins pa on pa.user_id = p.id
    where p.organization_id = p_org
  ) then
    raise exception 'No se puede eliminar una empresa a la que pertenece un super administrador'
      using errcode = '42501';
  end if;

  v_details := jsonb_build_object(
    'users',       (select count(*) from public.profiles where organization_id = p_org),
    'clients',     (select count(*) from public.clients where organization_id = p_org),
    'assets',      (select count(*) from public.assets where organization_id = p_org),
    'projects',    (select count(*) from public.projects where organization_id = p_org),
    'work_orders', (select count(*) from public.work_orders where organization_id = p_org),
    'quotes',      (select count(*) from public.quotes where organization_id = p_org),
    'invoices',    (select count(*) from public.invoices where organization_id = p_org)
  );

  insert into public.platform_audit_log (actor_id, action, target_id, target_name, details)
  values (auth.uid(), 'delete_organization', p_org, v_name, v_details);

  -- Children before parents (RESTRICT foreign keys)
  delete from public.invoices            where organization_id = p_org;
  delete from public.quote_items         where organization_id = p_org;
  delete from public.quotes              where organization_id = p_org;
  delete from public.maintenance_records where organization_id = p_org;
  delete from public.work_orders         where organization_id = p_org;
  delete from public.projects            where organization_id = p_org;
  delete from public.assets              where organization_id = p_org;
  delete from public.operators           where organization_id = p_org;
  delete from public.clients             where organization_id = p_org;
  delete from public.apu_catalog         where organization_id = p_org;

  -- Members' logins (profiles cascade from auth.users)
  delete from auth.users where id in (select id from public.profiles where organization_id = p_org);
  delete from public.profiles where organization_id = p_org;

  delete from public.organizations where id = p_org;
end $$;

revoke execute on function public.platform_delete_organization(uuid, text) from public, anon;
grant execute on function public.platform_delete_organization(uuid, text) to authenticated;

commit;

-- =============================================================================
-- Notes
-- * Audit trail:   select * from public.platform_audit_log order by created_at desc;
-- * Logo files of deleted organizations stay in Storage (bucket org-logos,
--   folder = organization id). Remove them from Storage → org-logos if needed.
-- =============================================================================
