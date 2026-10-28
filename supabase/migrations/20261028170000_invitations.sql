-- =============================================================================
-- Invitations: admins bring technicians and client users into their company.
--
-- * invitations: an admin invites an email as operario or cliente (cliente
--   invitations point to an existing client company). Expire after 14 days.
-- * claim_my_invitation(): called by the app right after sign-in when the
--   user has no organization yet. Only works once the email is confirmed, so
--   signing up with someone else's email never grants access.
--   It sets the profile's org and role, creates the operators row or links
--   the client company, and marks the invitation as accepted.
-- * guard_profile_update() lets that function set the organization; nothing
--   else can move a user between organizations.
-- * assets.qr_code gets a default, so the app never has to generate it.
--
-- REQUIRES Authentication → Providers → Email → "Confirm email" ON. With it
-- off every email counts as confirmed, and anyone could claim an invitation
-- by signing up with the invited address.
--
-- No service_role key or Edge Function needed. Single transaction.
-- Apply in Supabase → SQL Editor.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Invitations
-- -----------------------------------------------------------------------------
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.my_org_id()
                  references public.organizations(id) on delete cascade,
  email           text not null check (email = lower(trim(email)) and email like '%_@_%'),
  role            public.user_role not null check (role in ('operario', 'cliente')),
  full_name       text,
  specialty       text,                                    -- operario only
  client_id       uuid references public.clients(id) on delete cascade,  -- cliente only
  invited_by      uuid default auth.uid() references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default now() + interval '14 days',
  accepted_at     timestamptz,
  accepted_by     uuid references auth.users(id) on delete set null,
  constraint invitations_client_required check (role <> 'cliente' or client_id is not null)
);
create index invitations_organization_id_idx on public.invitations (organization_id);
create index invitations_email_idx on public.invitations (email) where accepted_at is null;
-- One open invitation per email and company; re-inviting replaces the old one in the app
create unique index invitations_open_email_uniq on public.invitations (organization_id, email)
  where accepted_at is null;

alter table public.invitations enable row level security;
revoke all on public.invitations from anon;
grant select, insert, update, delete on public.invitations to authenticated;

create policy "Admins manage invitations" on public.invitations
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (
    organization_id = (select public.my_org_id())
    and (select public.my_role()) = 'admin'
    and (client_id is null or client_id in (
      select c.id from public.clients c where c.organization_id = (select public.my_org_id())
    ))
  );

-- -----------------------------------------------------------------------------
-- 2. Profile guard: allow the org change made by claim_my_invitation() only.
--    The flag is transaction-local and can only be set from SQL, which
--    PostgREST clients cannot run.
-- -----------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or current_setting('fixo.claiming_invitation', true) = 'on' then
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

-- -----------------------------------------------------------------------------
-- 3. Claim: returns the new role, or null when there is nothing to claim.
-- -----------------------------------------------------------------------------
create or replace function public.claim_my_invitation()
returns public.user_role
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_email     text;
  v_confirmed timestamptz;
  v_inv       public.invitations;
begin
  if v_uid is null then
    return null;
  end if;

  select lower(u.email), u.email_confirmed_at into v_email, v_confirmed
  from auth.users u where u.id = v_uid;
  if v_confirmed is null then
    return null;
  end if;

  -- Never move someone who already belongs to a company
  if exists (select 1 from public.profiles p where p.id = v_uid and p.organization_id is not null) then
    return null;
  end if;

  select * into v_inv
  from public.invitations i
  where i.email = v_email and i.accepted_at is null and i.expires_at > now()
  order by i.created_at desc
  limit 1
  for update;
  if not found then
    return null;
  end if;

  if v_inv.role = 'cliente' then
    update public.clients
       set user_id = v_uid
     where id = v_inv.client_id and organization_id = v_inv.organization_id and user_id is null;
    if not found then
      raise exception 'Este cliente ya tiene un usuario vinculado. Pide al administrador una nueva invitación.'
        using errcode = 'P0001';
    end if;
  else
    insert into public.operators (organization_id, user_id, specialty)
    select v_inv.organization_id, v_uid, nullif(trim(v_inv.specialty), '')
    where not exists (select 1 from public.operators o where o.user_id = v_uid);
  end if;

  perform set_config('fixo.claiming_invitation', 'on', true);
  update public.profiles
     set organization_id = v_inv.organization_id,
         role            = v_inv.role,
         full_name       = coalesce(nullif(trim(full_name), ''), nullif(trim(v_inv.full_name), ''), full_name)
   where id = v_uid;
  perform set_config('fixo.claiming_invitation', 'off', true);

  update public.invitations
     set accepted_at = now(), accepted_by = v_uid
   where id = v_inv.id;

  return v_inv.role;
end $$;

revoke execute on function public.claim_my_invitation() from public, anon;
grant execute on function public.claim_my_invitation() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Assets: QR tag generated by the database
-- -----------------------------------------------------------------------------
alter table public.assets
  alter column qr_code set default 'FX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

commit;
