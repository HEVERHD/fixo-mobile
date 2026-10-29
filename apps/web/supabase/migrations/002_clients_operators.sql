-- =============================================
-- 002: Clients & Operators
-- =============================================

create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete set null,
  company_name   text not null,
  nit            text,
  address        text,
  contact_email  text,
  contact_phone  text,
  created_at     timestamptz not null default now()
);

create table public.operators (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete set null,
  specialty       text,
  license_number  text,
  created_at      timestamptz not null default now()
);

-- RLS: clients
alter table public.clients enable row level security;

create policy "Clients can view own record"
  on public.clients for select
  using (user_id = auth.uid());

create policy "Admins have full access to clients"
  on public.clients for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- RLS: operators
alter table public.operators enable row level security;

create policy "Operators can view own record"
  on public.operators for select
  using (user_id = auth.uid());

create policy "Admins have full access to operators"
  on public.operators for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Operators can view all operators (for assignments)"
  on public.operators for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'operario'
    )
  );
