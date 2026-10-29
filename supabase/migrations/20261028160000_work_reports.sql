-- =============================================================================
-- Work reports for any work order.
--
-- * maintenance_records.asset_id becomes optional: an order without equipment
--   (e.g. a construction task or a new installation) can still get a report.
-- * Clients see the reports of their own work orders, not only of their assets.
--
-- Single transaction. Apply in Supabase → SQL Editor.
-- =============================================================================

begin;

alter table public.maintenance_records alter column asset_id drop not null;

drop policy "Clients view maintenance of own assets" on public.maintenance_records;

create policy "Clients view reports of own orders and assets" on public.maintenance_records
  for select to authenticated
  using (
    organization_id = (select public.my_org_id())
    and (
      work_order_id in (
        select w.id from public.work_orders w
        join public.clients c on c.id = w.client_id
        where c.user_id = (select auth.uid())
      )
      or asset_id in (
        select a.id from public.assets a
        join public.clients c on c.id = a.client_id
        where c.user_id = (select auth.uid())
      )
    )
  );

commit;
