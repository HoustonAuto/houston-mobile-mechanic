create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'client',
  company_name text,
  garage_address text,
  garage_lat double precision,
  garage_lng double precision,
  contact_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists garage_address text;
alter table public.profiles add column if not exists garage_lat double precision;
alter table public.profiles add column if not exists garage_lng double precision;
alter table public.profiles add column if not exists contact_info text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('client', 'mechanic', 'admin'));

alter table public.profiles drop constraint if exists profiles_phone_check;
alter table public.profiles
  add constraint profiles_phone_check
  check (phone is null or phone = '' or phone ~ '^[0-9+(). -]{7,20}$');

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  mechanic_id uuid references auth.users(id) on delete set null,
  vehicle_address text not null,
  vehicle_lat double precision,
  vehicle_lng double precision,
  description text not null,
  contact_info text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Accepted', 'Denied', 'In Progress', 'Completed')),
  client_notified_at timestamptz,
  accepted_email_sent_at timestamptz,
  accepted_sms_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tickets add column if not exists vehicle_lat double precision;
alter table public.tickets add column if not exists vehicle_lng double precision;
alter table public.tickets add column if not exists accepted_email_sent_at timestamptz;
alter table public.tickets add column if not exists accepted_sms_sent_at timestamptz;
alter table public.tickets add column if not exists updated_at timestamptz not null default now();

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets(id) on delete set null,
  client_id uuid not null references auth.users(id) on delete cascade,
  mechanic_id uuid references auth.users(id) on delete cascade,
  client_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reviews add column if not exists mechanic_id uuid references auth.users(id) on delete cascade;
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

alter table public.reviews drop constraint if exists reviews_ticket_id_unique;
alter table public.reviews
  add constraint reviews_ticket_id_unique unique (ticket_id);

create table if not exists public.email_function_events (
  id uuid primary key default gen_random_uuid(),
  requester_id text not null,
  ticket_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_tickets_client_id on public.tickets (client_id);
create index if not exists idx_tickets_mechanic_id on public.tickets (mechanic_id);
create index if not exists idx_tickets_status on public.tickets (status);
create index if not exists idx_reviews_ticket_id on public.reviews (ticket_id);
create index if not exists idx_reviews_mechanic_id on public.reviews (mechanic_id);
create index if not exists idx_email_function_events_requester_created
  on public.email_function_events (requester_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

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

create or replace function public.is_mechanic()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'mechanic'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  );
$$;

create or replace function public.accept_ticket(ticket_id uuid)
returns public.tickets
language plpgsql
security definer set search_path = public
as $$
declare
  accepted_ticket public.tickets;
begin
  if not public.is_mechanic() then
    raise exception 'Only mechanics can accept tickets.';
  end if;

  update public.tickets
  set
    status = 'Accepted',
    mechanic_id = auth.uid(),
    client_notified_at = now()
  where id = ticket_id
  and mechanic_id is null
  and status = 'Pending'
  returning * into accepted_ticket;

  if accepted_ticket.id is null then
    raise exception 'Ticket is no longer available.';
  end if;

  return accepted_ticket;
end;
$$;

grant execute on function public.accept_ticket(uuid) to authenticated;

create or replace function public.create_ticket_review(
  p_ticket_id uuid,
  p_client_name text,
  p_rating integer,
  p_comment text
)
returns public.reviews
language plpgsql
security definer set search_path = public
as $$
declare
  reviewed_ticket public.tickets;
  created_review public.reviews;
begin
  select *
  into reviewed_ticket
  from public.tickets
  where tickets.id = p_ticket_id
  and tickets.client_id = auth.uid()
  and tickets.status = 'Completed'
  and tickets.mechanic_id is not null;

  if reviewed_ticket.id is null then
    raise exception 'Only the client can review a completed ticket.';
  end if;

  insert into public.reviews (
    ticket_id,
    client_id,
    mechanic_id,
    client_name,
    rating,
    comment
  )
  values (
    reviewed_ticket.id,
    auth.uid(),
    reviewed_ticket.mechanic_id,
    p_client_name,
    p_rating,
    p_comment
  )
  returning * into created_review;

  return created_review;
end;
$$;

grant execute on function public.create_ticket_review(uuid, text, integer, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.reviews enable row level security;
alter table public.email_function_events enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Clients can view mechanic profiles" on public.profiles;
create policy "Clients can view mechanic profiles"
  on public.profiles for select
  using (role = 'mechanic');

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
  with check (
    auth.uid() = client_id
    and mechanic_id is null
    and status = 'Pending'
    and client_notified_at is null
    and accepted_email_sent_at is null
    and accepted_sms_sent_at is null
  );

drop policy if exists "Clients can view their own tickets" on public.tickets;
create policy "Clients can view their own tickets"
  on public.tickets for select
  using (auth.uid() = client_id);

drop policy if exists "Mechanics can view incoming tickets" on public.tickets;
create policy "Mechanics can view incoming tickets"
  on public.tickets for select
  using (public.is_mechanic());

drop policy if exists "Mechanics can update incoming tickets" on public.tickets;
create policy "Mechanics can update incoming tickets"
  on public.tickets for update
  using (
    public.is_mechanic()
    and (
      mechanic_id = auth.uid()
      or (mechanic_id is null and status = 'Pending')
    )
  )
  with check (
    public.is_mechanic()
    and (
      mechanic_id = auth.uid()
      or (mechanic_id is null and status = 'Denied')
    )
  );

drop policy if exists "Mechanics can delete completed tickets" on public.tickets;
create policy "Mechanics can delete completed tickets"
  on public.tickets for delete
  using (
    status = 'Completed'
    and public.is_mechanic()
    and mechanic_id = auth.uid()
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
      and tickets.mechanic_id = reviews.mechanic_id
    )
  );

drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews"
  on public.reviews for update
  using (public.is_admin())
  with check (public.is_admin());
