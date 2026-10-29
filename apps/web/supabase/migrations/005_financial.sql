-- =============================================
-- 005: Financial (APU, Quotes, Invoices)
-- =============================================

create type public.quote_status   as enum ('borrador', 'enviada', 'aprobada', 'rechazada');
create type public.invoice_status as enum ('pendiente', 'abonado', 'pagado', 'en_mora');
create type public.apu_type       as enum ('material', 'mano_de_obra');

-- APU Catalog
create table public.apu_catalog (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  code        text not null,
  description text not null,
  unit        text not null,
  unit_price  numeric(12,2) not null,
  type        public.apu_type not null,
  created_at  timestamptz not null default now()
);

-- Seed APU catalog with common electromechanical items
insert into public.apu_catalog (category, code, description, unit, unit_price, type) values
  ('Mano de Obra', 'MO-001', 'Técnico electricista (hora)', 'HR', 45000, 'mano_de_obra'),
  ('Mano de Obra', 'MO-002', 'Técnico en HVAC (hora)', 'HR', 55000, 'mano_de_obra'),
  ('Mano de Obra', 'MO-003', 'Oficial electricista (hora)', 'HR', 35000, 'mano_de_obra'),
  ('Mano de Obra', 'MO-004', 'Ayudante (hora)', 'HR', 25000, 'mano_de_obra'),
  ('Mano de Obra', 'MO-005', 'Ingeniero supervisor (hora)', 'HR', 120000, 'mano_de_obra'),
  ('Materiales Eléctricos', 'ME-001', 'Cable THHN calibre 12 AWG', 'ML', 4500, 'material'),
  ('Materiales Eléctricos', 'ME-002', 'Cable THHN calibre 10 AWG', 'ML', 6800, 'material'),
  ('Materiales Eléctricos', 'ME-003', 'Cable THHN calibre 8 AWG', 'ML', 9500, 'material'),
  ('Materiales Eléctricos', 'ME-004', 'Breaker 1P 20A', 'UN', 35000, 'material'),
  ('Materiales Eléctricos', 'ME-005', 'Breaker 2P 30A', 'UN', 65000, 'material'),
  ('Materiales Eléctricos', 'ME-006', 'Breaker 3P 60A', 'UN', 120000, 'material'),
  ('Materiales Eléctricos', 'ME-007', 'Tablero eléctrico 12 circuitos', 'UN', 280000, 'material'),
  ('Materiales Eléctricos', 'ME-008', 'Tomacorriente doble polarizado', 'UN', 18000, 'material'),
  ('Materiales Eléctricos', 'ME-009', 'Interruptor sencillo', 'UN', 12000, 'material'),
  ('Materiales Eléctricos', 'ME-010', 'Tubo conduit 3/4"', 'ML', 8500, 'material'),
  ('HVAC', 'HV-001', 'Refrigerante R-410A', 'LB', 85000, 'material'),
  ('HVAC', 'HV-002', 'Refrigerante R-22', 'LB', 95000, 'material'),
  ('HVAC', 'HV-003', 'Filtro aire acondicionado 12x24', 'UN', 45000, 'material'),
  ('HVAC', 'HV-004', 'Condensador 1 ton', 'UN', 1200000, 'material'),
  ('HVAC', 'HV-005', 'Evaporador 1 ton', 'UN', 950000, 'material'),
  ('Redes Hidráulicas', 'RH-001', 'Bomba centrífuga 1HP', 'UN', 850000, 'material'),
  ('Redes Hidráulicas', 'RH-002', 'Tubería PVC 1"', 'ML', 12000, 'material'),
  ('Redes Hidráulicas', 'RH-003', 'Válvula de bola 1"', 'UN', 45000, 'material'),
  ('Generales', 'GE-001', 'Transporte y desplazamiento', 'VJ', 80000, 'mano_de_obra'),
  ('Generales', 'GE-002', 'Materiales consumibles (cinta, amarres, etc.)', 'GBL', 25000, 'material');

-- Sequences for numbering
create sequence if not exists quote_number_seq start 1;
create sequence if not exists invoice_number_seq start 1;

-- Quotes
create table public.quotes (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete restrict,
  work_order_id   uuid references public.work_orders(id) on delete set null,
  quote_number    text unique not null default ('COT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('quote_number_seq')::text, 4, '0')),
  subtotal        numeric(14,2) not null default 0,
  aiu_pct         numeric(5,2) not null default 25,
  aiu_amount      numeric(14,2) not null default 0,
  tax_pct         numeric(5,2) not null default 19,
  tax_amount      numeric(14,2) not null default 0,
  total           numeric(14,2) not null default 0,
  status          public.quote_status not null default 'borrador',
  valid_until     date,
  notes           text,
  created_at      timestamptz not null default now()
);

-- Quote items
create table public.quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  description  text not null,
  unit         text not null,
  quantity     numeric(10,2) not null default 1,
  unit_price   numeric(12,2) not null,
  total        numeric(14,2) generated always as (quantity * unit_price) stored
);

create index quote_items_quote_idx on public.quote_items(quote_id);

-- Invoices (cuentas de cobro)
create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid references public.quotes(id) on delete set null,
  client_id       uuid not null references public.clients(id) on delete restrict,
  invoice_number  text unique not null default ('CC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 4, '0')),
  amount          numeric(14,2) not null,
  status          public.invoice_status not null default 'pendiente',
  due_date        date,
  paid_date       date,
  notes           text,
  created_at      timestamptz not null default now()
);

create index invoices_client_idx on public.invoices(client_id);
create index invoices_status_idx on public.invoices(status);

-- RLS: apu_catalog (all authenticated users can read)
alter table public.apu_catalog enable row level security;
create policy "Authenticated users can read APU catalog"
  on public.apu_catalog for select
  using (auth.role() = 'authenticated');
create policy "Admins manage APU catalog"
  on public.apu_catalog for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- RLS: quotes
alter table public.quotes enable row level security;
create policy "Clients see their own quotes"
  on public.quotes for select
  using (
    exists (select 1 from public.clients c where c.id = quotes.client_id and c.user_id = auth.uid())
  );
create policy "Clients can approve/reject quotes"
  on public.quotes for update
  using (
    exists (select 1 from public.clients c where c.id = quotes.client_id and c.user_id = auth.uid())
  );
create policy "Admins have full access to quotes"
  on public.quotes for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- RLS: quote_items
alter table public.quote_items enable row level security;
create policy "Clients see their quote items"
  on public.quote_items for select
  using (
    exists (
      select 1 from public.quotes q
      join public.clients c on c.id = q.client_id
      where q.id = quote_items.quote_id and c.user_id = auth.uid()
    )
  );
create policy "Admins have full access to quote items"
  on public.quote_items for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- RLS: invoices
alter table public.invoices enable row level security;
create policy "Clients see their own invoices"
  on public.invoices for select
  using (
    exists (select 1 from public.clients c where c.id = invoices.client_id and c.user_id = auth.uid())
  );
create policy "Admins have full access to invoices"
  on public.invoices for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
