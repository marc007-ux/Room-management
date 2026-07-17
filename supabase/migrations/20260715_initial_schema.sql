-- ============================================================
-- Room Availability and Rental Management System
-- Initial Database Schema + Row Level Security
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- Rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  category_id uuid references categories(id) on delete set null,
  description text,
  floor int,
  capacity int,
  status text not null default 'available'
    check (status in ('available','reserved','occupied','maintenance','out_of_service')),
  created_at timestamptz default now()
);

-- Clients
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  identification text,
  address text,
  created_at timestamptz default now()
);

-- Profiles (linked 1:1 to Supabase auth users, stores role)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'receptionist' check (role in ('admin','receptionist')),
  created_at timestamptz default now()
);

-- Reservations
create table reservations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  amount numeric(10,2) not null default 0,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz default now(),
  check (end_date > start_date)
);

-- Payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references reservations(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  payment_method text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. ROW LEVEL SECURITY — enable on every table
-- ------------------------------------------------------------

alter table categories enable row level security;
alter table rooms enable row level security;
alter table clients enable row level security;
alter table profiles enable row level security;
alter table reservations enable row level security;
alter table payments enable row level security;

-- ------------------------------------------------------------
-- 3. RLS POLICIES — authenticated staff can read/write
-- ------------------------------------------------------------

-- Categories
create policy "Authenticated users can view categories" on categories
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage categories" on categories
  for all using (auth.role() = 'authenticated');

-- Rooms
create policy "Authenticated users can view rooms" on rooms
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage rooms" on rooms
  for all using (auth.role() = 'authenticated');

-- Clients
create policy "Authenticated users can view clients" on clients
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage clients" on clients
  for all using (auth.role() = 'authenticated');

-- Reservations
create policy "Authenticated users can view reservations" on reservations
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage reservations" on reservations
  for all using (auth.role() = 'authenticated');

-- Payments
create policy "Authenticated users can view payments" on payments
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can manage payments" on payments
  for all using (auth.role() = 'authenticated');

-- Profiles: everyone authenticated can view profiles, but only edit their own
create policy "Authenticated users can view profiles" on profiles
  for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- ------------------------------------------------------------
-- 4. TRIGGER — auto-create a profile row on signup
-- ------------------------------------------------------------

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', 'receptionist');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- End of initial schema
-- ============================================================
