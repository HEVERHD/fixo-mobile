-- =============================================================================
-- Evidence photos for work reports.
--
-- * Private bucket work-photos. Path: <organization_id>/<work_order_id>/<file>.
-- * Upload: only the technician assigned to the order, while it is en_proceso
--   (the report is written before the order moves to completada).
-- * Read: admins and technicians of the company, and the client the order
--   belongs to. Apps show them through short-lived signed URLs.
-- * maintenance_records.photos (text[], already exists) stores the object paths.
--
-- No service_role key needed. Single transaction. Apply in Supabase → SQL Editor.
-- =============================================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('work-photos', 'work-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Orders the signed-in technician may attach photos to right now
create or replace function public.my_open_work_order_ids()
returns setof text
language sql stable security definer
set search_path = ''
as $$
  select w.id::text
  from public.work_orders w
  join public.operators o on o.id = w.assigned_operator_id
  where o.user_id = auth.uid()
    and w.organization_id = public.my_org_id()
    and w.status = 'en_proceso'
$$;

revoke execute on function public.my_open_work_order_ids() from public, anon;
grant execute on function public.my_open_work_order_ids() to authenticated;

create policy "Company reads work photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'work-photos'
    and (storage.foldername(name))[1] = (select public.my_org_id())::text
    and (
      (select public.my_role()) in ('admin', 'operario')
      or (storage.foldername(name))[2] in (
        select w.id::text from public.work_orders w
        join public.clients c on c.id = w.client_id
        where c.user_id = (select auth.uid())
      )
    )
  );

create policy "Assigned technician uploads work photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'work-photos'
    and (storage.foldername(name))[1] = (select public.my_org_id())::text
    and (storage.foldername(name))[2] in (select public.my_open_work_order_ids())
  );

-- Lets the technician remove a photo before closing the order
create policy "Assigned technician deletes work photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'work-photos'
    and (storage.foldername(name))[1] = (select public.my_org_id())::text
    and (storage.foldername(name))[2] in (select public.my_open_work_order_ids())
  );

commit;
