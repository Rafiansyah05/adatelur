create table consumer_addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,

  label text default 'Rumah',
  full_address text not null,
  latitude double precision not null,
  longitude double precision not null,
  is_default boolean not null default true,

  created_at timestamptz not null default now()
);
