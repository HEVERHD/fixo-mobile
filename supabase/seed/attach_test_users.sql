-- =============================================================================
-- Attach two test users (created from Supabase → Authentication → Users →
-- "Add user" → "Create new user", with "Auto Confirm User" checked) to the
-- HDESARROLLOS organization:
--   * one as operario (field technician)
--   * one as cliente, linked to the client company "Clínica San Rafael"
--
-- Edit the two emails below, then run in Supabase → SQL Editor.
-- Safe to run more than once.
-- =============================================================================

do $$
declare
  v_operator_email text := 'operario.prueba@gmail.com';   -- ← cambia
  v_client_email   text := 'cliente.prueba@gmail.com';    -- ← cambia
  v_org         uuid;
  v_op_user     uuid;
  v_client_user uuid;
begin
  select id into v_org from public.organizations where name like 'HDESARROLLOS%' limit 1;
  if v_org is null then raise exception 'No se encontró la empresa HDESARROLLOS'; end if;

  select id into v_op_user from auth.users where email = v_operator_email;
  if v_op_user is null then raise exception 'No existe el usuario %', v_operator_email; end if;

  select id into v_client_user from auth.users where email = v_client_email;
  if v_client_user is null then raise exception 'No existe el usuario %', v_client_email; end if;

  -- Operario
  update public.profiles
     set organization_id = v_org, role = 'operario', full_name = 'Carlos Técnico'
   where id = v_op_user;

  insert into public.operators (organization_id, user_id, specialty)
  select v_org, v_op_user, 'Técnico general'
  where not exists (select 1 from public.operators where user_id = v_op_user);

  -- Cliente (portal user of an existing client company)
  update public.profiles
     set organization_id = v_org, role = 'cliente', full_name = 'Laura Cliente'
   where id = v_client_user;

  update public.clients
     set user_id = v_client_user
   where organization_id = v_org and company_name = 'Clínica San Rafael';
end $$;

-- Check:
-- select u.email, p.full_name, p.role, o.name
-- from auth.users u join public.profiles p on p.id = u.id
-- left join public.organizations o on o.id = p.organization_id;
