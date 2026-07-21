create table peternak_verification_photos (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,
  photo_type text not null check (photo_type in ('kandang_luar', 'kandang_dalam', 'ayam', 'telur')),
  photo_url text not null,                         -- Supabase Storage path
  uploaded_at timestamptz not null default now(),

  unique (peternak_id, photo_type)
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,
  vehicle_type text not null,                      -- 'motor', 'mobil pickup', dll
  plate_number text,
  created_at timestamptz not null default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,

  price_per_rak numeric(10,2) not null,
  stock_rak integer not null default 0,             -- PRIVATE, jangan expose di API publik
  is_available boolean generated always as (stock_rak > 0 and is_listing_active) stored,
  is_listing_active boolean not null default true,   -- peternak bisa manual off/on

  listing_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_listings_peternak on listings(peternak_id);
create index idx_listings_available on listings(is_available);

-- RLS listings
alter table listings enable row level security;
create policy "public can view listings" on listings for select using (true);

create table daily_production_log (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,
  log_date date not null default current_date,

  predicted_eggs integer not null,                 -- hasil formula sistem
  actual_eggs integer,                              -- diisi jika peternak edit (null jika confirm "Benar")
  confirmed_via text not null default 'whatsapp' check (confirmed_via in ('whatsapp', 'web')),

  created_at timestamptz not null default now(),
  unique (peternak_id, log_date)
);

create table delivery_slots (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,

  slot_date date not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,          -- peternak bisa nonaktifkan slot tertentu
  max_orders integer default 1,                     -- opsional, batasi berapa order per slot

  created_at timestamptz not null default now()
);

create index idx_delivery_slots_peternak_date on delivery_slots(peternak_id, slot_date);

create table peternak_scores (
  peternak_id uuid primary key references peternak_details(id) on delete cascade,

  total_transaction_value numeric(14,2) not null default 0,
  transaction_score numeric(5,2) not null default 0,     -- 0-100, ternormalisasi

  delivery_accuracy_pct numeric(5,2) not null default 0,  -- 0-100
  delivery_score numeric(5,2) not null default 0,

  average_rating numeric(3,2) not null default 0,          -- 1.00-5.00
  rating_score numeric(5,2) not null default 0,             -- 0-100, ternormalisasi

  final_score numeric(5,2) not null default 0,               -- weighted: 0.5*transaction + 0.3*delivery + 0.2*rating
  is_suspended boolean not null default false,
  suspended_at timestamptz,
  suspension_reason text,

  updated_at timestamptz not null default now()
);

create table price_alerts (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,

  peternak_price numeric(10,2) not null,
  market_reference_price numeric(10,2) not null,
  deviation_pct numeric(5,2) not null,               -- (market - peternak) / peternak * 100
  direction text not null check (direction in ('naik', 'turun')),

  notified_at timestamptz not null default now()
);
