create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('consumer', 'peternak')),
  full_name text not null,
  phone_number text not null unique,
  email text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);

-- RLS
alter table profiles enable row level security;
create policy "users can view own profile" on profiles for select using (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);
