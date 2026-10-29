-- =============================================
-- 004: Work Orders & Maintenance Records
-- =============================================

create type public.work_order_type   as enum ('preventivo', 'correctivo', 'instalacion');
create type public.work_order_status as enum ('pendiente', 'en_proceso', 'completada', 'cancelada');
create type public.priority_level    as enum ('baja', 'media', 'alta', 'urgente');

create table public.work_orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text unique not null,
  client_id            uuid not null references public.clients(id) on delete restrict,
  asset_id             uuid references public.assets(id) on delete set null,
  assigned_operator_id uuid references public.operators(id) on delete set null,
  type                 public.work_order_type   not null default 'correctivo',
  priority             public.priority_level    not null default 'media',
  status               public.work_order_status not null default 'pendiente',
  scheduled_date       date,
  completed_date       date,
  description          text not null,
  notes                text,
  created_at           timestamptz not null default now()
);

create index work_orders_client_idx   on public.work_orders(client_id);
create index work_orders_operator_idx on public.work_orders(assigned_operator_id);
create index work_orders_status_idx   on public.work_orders(status);

-- Auto-generate order number
create or replace function public.generate_order_number()
returns trigger language plpgsql as $$
begin
  new.order_number := 'OT-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('order_number_seq')::text, 5, '0');
  return new;
end;
$$;

create sequence if not exists order_number_seq start 1;

create trigger set_order_number
  before insert on public.work_orders
  for each row
  when (new.order_number is null or new.order_number = '')
  execute procedure public.generate_order_number();

-- Maintenance records
create table public.maintenance_records (
  id               uuid primary key default gen_random_uuid(),
  work_order_id    uuid not null references public.work_orders(id) on delete cascade,
  asset_id         uuid not null references public.assets(id) on delete restrict,
  operator_id      uuid not null references public.operators(id) on delete restrict,
  date             timestamptz not null default now(),
  tasks_performed  text not null,
  observations     text,
  photos           text[] default '{}',
  signature_url    text,
  pending_tasks    text
);

create index maintenance_asset_idx on public.maintenance_records(asset_id);
create index maintenance_operator_idx on public.maintenance_records(operator_id);

-- RLS: work_orders
alter table public.work_orders enable row level security;

create policy "Clients see their own work orders"
  on public.work_orders for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = work_orders.client_id and c.user_id = auth.uid()
    )
  );

create policy "Operators see their assigned work orders"
  on public.work_orders for select
  using (
    exists (
      select 1 from public.operators o
      where o.id = work_orders.assigned_operator_id and o.user_id = auth.uid()
    )
  );

create policy "Operators can update their assigned work orders"
  on public.work_orders for update
  using (
    exists (
      select 1 from public.operators o
      where o.id = work_orders.assigned_operator_id and o.user_id = auth.uid()
    )
  );

create policy "Admins have full access to work orders"
  on public.work_orders for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- RLS: maintenance_records
alter table public.maintenance_records enable row level security;

create policy "Operators manage their own records"
  on public.maintenance_records for all
  using (
    exists (
      select 1 from public.operators o
      where o.id = maintenance_records.operator_id and o.user_id = auth.uid()
    )
  );

create policy "Clients see records for their assets"
  on public.maintenance_records for select
  using (
    exists (
      select 1 from public.assets a
      join public.clients c on c.id = a.client_id
      where a.id = maintenance_records.asset_id and c.user_id = auth.uid()
    )
  );

create policy "Admins have full access to maintenance records"
  on public.maintenance_records for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Anyone can read maintenance records (for QR public page)
create policy "Anyone can view maintenance records for QR scan"
  on public.maintenance_records for select
  using (true);
