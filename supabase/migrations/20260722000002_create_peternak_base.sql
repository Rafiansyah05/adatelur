create table peternak_details (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,

  -- Tahap 1: Data Dasar
  birth_date date not null,
  farm_address text not null,
  farm_latitude double precision not null,
  farm_longitude double precision not null,

  -- Tahap 2: Data Operasional
  registration_method text not null check (registration_method in ('video_call_cs', 'self_form')),
  chicken_count integer not null,
  daily_egg_production integer not null,          -- estimasi butir/hari saat registrasi
  daily_damaged_eggs integer not null default 0,
  daily_clean_eggs integer not null,
  feed_type text not null,
  farming_experience_years numeric(4,1) not null,
  has_vehicle boolean not null default false,

  -- Status Verifikasi
  verification_status text not null default 'pending'
      check (verification_status in ('pending', 'in_review', 'approved', 'rejected', 'expired')),
  verification_submitted_at timestamptz not null default now(),
  verification_decided_at timestamptz,
  verification_notes text,                        -- catatan CS/sistem jika rejected

  -- Status Operasional (harian)
  is_active boolean not null default true,         -- peternak nonaktifkan diri sementara
  current_price_per_rak numeric(10,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_peternak_verification_status on peternak_details(verification_status);
create index idx_peternak_location on peternak_details(farm_latitude, farm_longitude);

-- RLS
alter table peternak_details enable row level security;
create policy "peternak sees own details" on peternak_details for select using (auth.uid() = profile_id);
