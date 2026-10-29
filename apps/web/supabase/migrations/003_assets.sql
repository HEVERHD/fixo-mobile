-- =============================================
-- 003: Assets (Equipos con QR)
-- =============================================

create type public.asset_status as enum ('activo', 'en_mantenimiento', 'fuera_de_servicio');

create table public.assets (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  qr_code           text unique not null,
  name              text not null,
  type              text not null,
  brand             text,
  model             text,
  serial_number     text,
  location          text,
  installation_date date,
  specs             jsonb,
  status            public.asset_status not null default 'activo',
  created_at        timestamptz not null default now()
);

create index assets_client_id_idx on public.assets(client_id);
create index assets_qr_code_idx on public.assets(qr_code);

-- RLS
alter table public.assets enable row level security;

create policy "Clients see their own assets"
  on public.assets for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = assets.client_id and c.user_id = auth.uid()
    )
  );

create policy "Operators see assets of their assigned work orders"
  on public.assets for select
  using (
    exists (
      select 1 from public.work_orders wo
      join public.operators o on o.id = wo.assigned_operator_id
      where wo.asset_id = assets.id and o.user_id = auth.uid()
    )
  );

create policy "Admins have full access to assets"
  on public.assets for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Public read for QR scan page (assets are visible without auth)
create policy "Anyone can view asset for QR scan"
  on public.assets for select
  using (true);
