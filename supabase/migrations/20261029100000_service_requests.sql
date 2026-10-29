-- =============================================================================
-- Service requests: client users ask their provider for a service from the
-- client portal (web); the company admin accepts it (creating a work order)
-- or rejects it with a reason.
--
-- * service_requests: one row per request. Clients can only create requests
--   for their own client company (and its assets) and only read their own.
--   Nothing a client sends can set the status, the response or the work order.
-- * accept_service_request(): creates the work order and marks the request as
--   accepted in one step. SECURITY INVOKER, so the admin's RLS applies.
--
-- No service_role key or Edge Function needed. Single transaction.
-- Apply in Supabase → SQL Editor.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Table
-- -----------------------------------------------------------------------------
create type public.service_request_status as enum ('nueva', 'aceptada', 'rechazada');

create table public.service_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null default public.my_org_id()
                  references public.organizations(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  asset_id        uuid references public.assets(id) on delete set null,
  description     text not null check (char_length(trim(description)) between 5 and 2000),
  priority        public.priority_level not null default 'media',
  status          public.service_request_status not null default 'nueva',
  response        text check (response is null or char_length(response) <= 1000),  -- reason when rejected
  work_order_id   uuid references public.work_orders(id) on delete set null,
  requested_by    uuid default auth.uid() references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  answered_at     timestamptz
);
create index service_requests_organization_id_idx on public.service_requests (organization_id);
create index service_requests_client_id_idx on public.service_requests (client_id);
create index service_requests_open_idx on public.service_requests (organization_id) where status = 'nueva';

alter table public.service_requests enable row level security;
revoke all on public.service_requests from anon;
grant select, insert, update, delete on public.service_requests to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Policies
-- -----------------------------------------------------------------------------
create policy "Admins manage service requests" on public.service_requests
  for all to authenticated
  using (organization_id = (select public.my_org_id()) and (select public.my_role()) = 'admin')
  with check (
    organization_id = (select public.my_org_id())
    and (select public.my_role()) = 'admin'
    and client_id in (select c.id from public.clients c where c.organization_id = (select public.my_org_id()))
  );

create policy "Clients view own service requests" on public.service_requests
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );

-- New requests only: the answer fields stay empty and the asset must belong to the same client.
create policy "Clients create own service requests" on public.service_requests
  for insert to authenticated
  with check (
    organization_id = (select public.my_org_id())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
    and requested_by = (select auth.uid())
    and status = 'nueva'
    and response is null
    and work_order_id is null
    and answered_at is null
    and (asset_id is null or asset_id in (
      select a.id from public.assets a where a.client_id = service_requests.client_id
    ))
  );

-- -----------------------------------------------------------------------------
-- 3. Accept: returns the new work order id.
-- -----------------------------------------------------------------------------
create or replace function public.accept_service_request(
  p_request_id     uuid,
  p_type           public.work_order_type default 'correctivo',
  p_operator_id    uuid default null,
  p_scheduled_date date default null
)
returns uuid
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_request public.service_requests;
  v_order   uuid;
begin
  -- RLS: only an admin of the request's company can see (and lock) it
  select * into v_request from public.service_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Solicitud no encontrada' using errcode = 'P0002';
  end if;
  if v_request.status <> 'nueva' then
    raise exception 'La solicitud ya fue respondida' using errcode = '42501';
  end if;
  if p_operator_id is not null and not exists (
    select 1 from public.operators o
    where o.id = p_operator_id and o.organization_id = v_request.organization_id
  ) then
    raise exception 'Técnico no válido' using errcode = '42501';
  end if;

  insert into public.work_orders (client_id, asset_id, assigned_operator_id, type, priority, scheduled_date, description)
  values (v_request.client_id, v_request.asset_id, p_operator_id, p_type, v_request.priority, p_scheduled_date,
          v_request.description)
  returning id into v_order;

  update public.service_requests
  set status = 'aceptada', work_order_id = v_order, answered_at = now()
  where id = p_request_id;

  return v_order;
end $$;

revoke execute on function public.accept_service_request(uuid, public.work_order_type, uuid, date) from public, anon;
grant execute on function public.accept_service_request(uuid, public.work_order_type, uuid, date) to authenticated;

commit;
