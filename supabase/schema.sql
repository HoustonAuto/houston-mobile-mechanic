create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'client' check (role in ('client', 'mechanic')),
  company_name text,
  garage_address text,
  contact_info text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists garage_address text;
alter table public.profiles add column if not exists contact_info text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
  accepted_email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tickets add column if not exists accepted_email_sent_at timestamptz;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete set null,
  client_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Clients can create their own tickets" on public.tickets;
create policy "Clients can create their own tickets"
  on public.tickets for insert
  with check (auth.uid() = client_id);

drop policy if exists "Clients can view their own tickets" on public.tickets;
create policy "Clients can view their own tickets"
  on public.tickets for select
  using (auth.uid() = client_id);

drop policy if exists "Mechanics can view incoming tickets" on public.tickets;
create policy "Mechanics can view incoming tickets"
  on public.tickets for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'mechanic'
    )
  );

drop policy if exists "Mechanics can update incoming tickets" on public.tickets;
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

drop policy if exists "Mechanics can delete completed tickets" on public.tickets;
create policy "Mechanics can delete completed tickets"
  on public.tickets for delete
  using (
    status = 'Completed'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'mechanic'
    )
  );

drop policy if exists "Anyone can view approved reviews" on public.reviews;
create policy "Anyone can view approved reviews"
  on public.reviews for select
  using (approved = true);

drop policy if exists "Clients can review completed tickets" on public.reviews;
create policy "Clients can review completed tickets"
  on public.reviews for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.tickets
      where tickets.id = ticket_id
      and tickets.client_id = auth.uid()
      and tickets.status = 'Completed'
    )
  );
