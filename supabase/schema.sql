create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'client' check (role in ('client', 'mechanic')),
  company_name text,
  garage_address text,
  contact_info text,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  mechanic_id uuid references auth.users(id) on delete set null,
  vehicle_address text not null,
  description text not null,
  contact_info text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Accepted', 'Denied', 'In Progress', 'Completed')),
  client_notified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Clients can create their own tickets"
  on public.tickets for insert
  with check (auth.uid() = client_id);

create policy "Clients can view their own tickets"
  on public.tickets for select
  using (auth.uid() = client_id);

create policy "Mechanics can view incoming tickets"
  on public.tickets for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'mechanic'
    )
  );

create policy "Mechanics can update incoming tickets"
  on public.tickets for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'mechanic'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'mechanic'
    )
  );
