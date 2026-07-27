# Schema Database — adatelur.com

**Database Engine:** PostgreSQL (via Supabase)
Versi: 1.0 | Tanggal: 21 Juli 2026
Rujukan: `prd.md`

---

## 1. Prinsip Desain Schema

1. Satu tabel `users` sebagai basis Supabase Auth, di-extend dengan tabel `profiles` yang punya `role` (`consumer` / `peternak`).
2. Data spesifik peternak (produksi, verifikasi, kendaraan) dipisah ke tabel `peternak_details` — supaya tabel `profiles` tetap ringan untuk role konsumen.
3. **Stok tidak disimpan sebagai angka yang exposed ke API publik** — kolom stok ada di backend, tapi endpoint publik hanya mengembalikan `is_available: boolean`. (Lihat catatan RLS di §9.)
4. Semua tabel pakai `uuid` sebagai primary key (`gen_random_uuid()`), konsisten dengan konvensi Supabase.
5. Timestamp pakai `timestamptz`, default `now()`.
6. Soft delete tidak digunakan untuk MVP (kompleksitas rendah, waktu terbatas) — gunakan status/flag kolom saja.

---

## 2. Entity Relationship Overview

```
users (Supabase Auth)
  └── profiles (1:1)
        ├── peternak_details (1:1, jika role=peternak)
        │     ├── peternak_verification_photos (1:N)
        │     ├── vehicles (1:N)
        │     └── listings (1:N)
        │           └── delivery_slots (1:N)
        └── consumer_addresses (1:N, jika role=consumer)

orders
  ├── consumer_id → profiles
  ├── peternak_id → profiles
  ├── listing_id → listings
  ├── order_status_history (1:N)
  ├── delivery_proof (1:1)
  └── ratings (1:1)

peternak_scores (1:1 per peternak, recalculated)
price_alerts (log notifikasi harga)
notifications_log (log seluruh notifikasi WA/push)
```

---

## 3. Tabel: `profiles`

Extend dari `auth.users` Supabase.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('consumer', 'peternak', 'admin')),
  full_name text not null,
  phone_number text not null unique,
  email text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);
```

---

## 4. Tabel: `peternak_details`

Data dari Registrasi Tahap 1 & 2.

```sql
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
```

> **Catatan:** `daily_egg_production`, `daily_damaged_eggs`, `daily_clean_eggs` di tabel ini adalah nilai **estimasi awal saat registrasi** (dasar formula prediksi produksi harian, lihat PRD §12.2). Nilai produksi **aktual harian** dicatat terpisah di tabel `daily_production_log` (§8) agar histori tidak menimpa data registrasi awal.

---

## 5. Tabel: `peternak_verification_photos`

4 foto wajib dari Registrasi Tahap 3.

```sql
create table peternak_verification_photos (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,
  photo_type text not null check (photo_type in ('kandang_luar', 'kandang_dalam', 'ayam', 'telur')),
  photo_url text not null,                         -- Supabase Storage path
  uploaded_at timestamptz not null default now(),

  unique (peternak_id, photo_type)
);
```

---

## 6. Tabel: `vehicles`

```sql
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,
  vehicle_type text not null,                      -- 'motor', 'mobil pickup', dll
  plate_number text,
  created_at timestamptz not null default now()
);
```

---

## 7. Tabel: `listings`

Posting telur harian per peternak. **Stok exact hanya ada di sini, tidak pernah di-expose langsung.**

```sql
create table listings (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,

  price_per_rak numeric(10,2) not null,
  stock_rak integer not null default 0,             -- PRIVATE, jangan expose di API publik
  is_available boolean generated always as (stock_rak > 0 and is_listing_active) stored,
  is_listing_active boolean not null default true,   -- peternak bisa manual off/on

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(peternak_id)
);

create index idx_listings_peternak on listings(peternak_id);
create index idx_listings_available on listings(is_available);
```

---

## 8. Tabel: `daily_production_log`

Log harian hasil konfirmasi/edit peternak atas prediksi sistem (PRD §6.5).

```sql
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
```

---

## 9. Tabel: `delivery_slots`

Slot waktu yang ditentukan peternak sendiri (PRD §5.5).

```sql
create table delivery_slots (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,

  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,          -- peternak bisa nonaktifkan slot tertentu
  max_orders integer default 1,                     -- opsional, batasi berapa order per slot

  created_at timestamptz not null default now()
);

create index idx_delivery_slots_peternak on delivery_slots(peternak_id);

-- RLS (Row Level Security)
alter table delivery_slots enable row level security;
create policy "public can view delivery slots" on delivery_slots for select using (true);
create policy "peternak can manage own delivery slots" on delivery_slots for all using (auth.uid() = (select profile_id from peternak_details where id = peternak_id));
```

---

## 10. Tabel: `consumer_addresses`

```sql
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
```

---

## 11. Tabel: `orders`

Tabel inti transaksi.

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,                  -- human-readable, e.g. "ADT-20260721-0001"

  consumer_id uuid not null references profiles(id),
  peternak_id uuid not null references peternak_details(id),
  listing_id uuid not null references listings(id),

  rak_quantity integer not null check (rak_quantity >= 1),
  price_per_rak numeric(10,2) not null,             -- snapshot harga saat order dibuat
  subtotal numeric(10,2) not null,                  -- price_per_rak * rak_quantity
  
  -- Rating (hanya diisi setelah order_status = completed)
  rating smallint check (rating >= 1 and rating <= 5),

  -- Metode & Waktu
  fulfillment_method varchar(20) not null check (fulfillment_method in ('pickup', 'delivery')),
  distance_km numeric(6,2),                          -- null jika pickup
  ongkir_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null,                -- subtotal + ongkir

  delivery_slot_id uuid references delivery_slots(id),
  consumer_address_id uuid references consumer_addresses(id),  -- null jika pickup

  payment_status text not null default 'unpaid'
      check (payment_status in ('unpaid', 'paid', 'refunded')),
  payment_method text,                               -- 'ewallet', 'mbanking', 'qris'
  payment_reference text,                             -- ID dari Midtrans

  order_status text not null default 'waiting'
      check (order_status in ('waiting', 'accepted', 'rejected', 'expired', 'in_delivery', 'completed', 'cancelled')),

  responded_at timestamptz,                           -- kapan peternak accept/reject
  response_deadline timestamptz not null,             -- created_at + 5 menit
  push_notif_sent_at timestamptz,                      -- kapan trigger 3-menit terkirim

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_consumer on orders(consumer_id);
create index idx_orders_peternak on orders(peternak_id);
create index idx_orders_status on orders(order_status);
create index idx_orders_response_deadline on orders(response_deadline) where order_status = 'waiting';
```

> **Catatan implementasi window 5 menit:** gunakan **Supabase Edge Function + `pg_cron`** (atau scheduled job eksternal, mis. cron job di Vercel) yang berjalan tiap 30–60 detik, query `orders where order_status='waiting' and response_deadline < now()`, lalu set jadi `expired` dan trigger re-routing otomatis. Untuk trigger push notification di menit ke-3, jalankan job serupa dengan kondisi `now() - created_at > interval '3 minutes' and push_notif_sent_at is null`.

---

## 12. Tabel: `order_status_history`

Tracking step demi step (PRD §5.6).

```sql
create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_order_status_history_order on order_status_history(order_id);
```

---

## 13. Tabel: `delivery_proof`

Foto bukti pengiriman, diambil langsung dari kamera in-app (PRD §5.7).

```sql
create table delivery_proof (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  photo_url text not null,                          -- Supabase Storage path
  captured_at timestamptz not null default now(),
  is_within_slot boolean,                            -- dihitung: captured_at masih dalam range delivery_slot?
  created_at timestamptz not null default now()
);
```

---

## 14. Tabel: `ratings`

```sql
create table ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  consumer_id uuid not null references profiles(id),
  peternak_id uuid not null references peternak_details(id),

  rating_value integer not null check (rating_value between 1 and 5),
  review_text text,

  created_at timestamptz not null default now()
);

create index idx_ratings_peternak on ratings(peternak_id);
```

---

## 15. Tabel: `peternak_scores`

Skor teragregasi (PRD §7), di-recalculate tiap ada order/rating baru.

```sql
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
```

> **Formula normalisasi (rekomendasi implementasi):**
> - `transaction_score`: normalisasi relatif terhadap peternak lain (mis. persentil dalam platform), atau skala absolut dengan cap (mis. Rp 5.000.000 omzet kumulatif = 100 poin, linear di bawahnya). Pilih skala absolut untuk MVP — lebih predictable saat demo.
> - `delivery_score` = `delivery_accuracy_pct` langsung (sudah dalam skala 0–100).
> - `rating_score` = `(average_rating / 5) × 100`.
> - `final_score = (transaction_score × 0.5) + (delivery_score × 0.3) + (rating_score × 0.2)`.
> - **Threshold suspend (rekomendasi):** `final_score < 30` selama berjalan → set `is_suspended = true`, listing otomatis disembunyikan dari hasil pencarian (tanpa menghapus data).

---

## 16. Tabel: `price_alerts`

Log notifikasi perubahan harga pasar ≥10% (PRD §6.5, stretch goal).

```sql
create table price_alerts (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,

  peternak_price numeric(10,2) not null,
  market_reference_price numeric(10,2) not null,
  deviation_pct numeric(5,2) not null,               -- (market - peternak) / peternak * 100
  direction text not null check (direction in ('naik', 'turun')),

  notified_at timestamptz not null default now()
);
```

---

## 17. Tabel: `notifications_log`

Log seluruh notifikasi terkirim (audit trail, debugging saat demo).

```sql
create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id),
  channel text not null check (channel in ('whatsapp', 'push_pwa', 'in_app')),
  notif_type text not null,                           -- 'order_new', 'order_reminder', 'verification_result', dll
  payload jsonb,
  related_order_id uuid references orders(id),
  sent_at timestamptz not null default now(),
  delivery_status text default 'sent' check (delivery_status in ('sent', 'failed', 'read'))
);

create index idx_notifications_recipient on notifications_log(recipient_id);
```

---

## 18. Row Level Security (RLS) — Ketentuan Penting

Supabase mengaktifkan RLS per tabel. Ketentuan minimum untuk MVP:

```sql
-- profiles: user hanya bisa lihat & update profil sendiri, tapi publik boleh baca nama & avatar (untuk listing)
alter table profiles enable row level security;
create policy "users can view own profile" on profiles for select using (auth.uid() = id);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

-- listings: SIAPA SAJA (termasuk anon) boleh SELECT, TAPI HARUS lewat VIEW yang menyembunyikan stock_rak
alter table listings enable row level security;
create policy "public can view listings" on listings for select using (true);
-- ⚠️ WAJIB: buat VIEW terpisah untuk konsumsi publik (lihat §19), JANGAN query tabel listings langsung dari frontend konsumen

-- orders: konsumen hanya lihat order miliknya, peternak hanya lihat order yang masuk ke dia
alter table orders enable row level security;
create policy "consumer sees own orders" on orders for select using (auth.uid() = consumer_id);
create policy "peternak sees own orders" on orders for select
  using (auth.uid() = (select profile_id from peternak_details where id = peternak_id));

-- peternak_details: data sensitif (produksi, verifikasi) hanya bisa dibaca pemilik + service role (backend)
alter table peternak_details enable row level security;
create policy "peternak sees own details" on peternak_details for select using (auth.uid() = profile_id);
```

---

## 19. VIEW Khusus: `public_listings`

**Sangat penting** — ini yang menjamin stok tidak pernah bocor ke API publik (PRD §9 poin 2).

```sql
create view public_listings as
select
  l.id as listing_id,
  l.peternak_id,
  pd.farm_latitude,
  pd.farm_longitude,
  l.price_per_rak,
  l.is_available,              -- boolean saja, BUKAN stock_rak
  ps.final_score,
  p.full_name as peternak_name,
  p.avatar_url,
  -- Subquery untuk mendapatkan total pesanan selesai per peternak
  (
    SELECT count(*)
    FROM orders o
    WHERE o.peternak_id = l.peternak_id
      AND o.order_status = 'completed'
  )::int AS total_completed_orders,
  -- Subquery untuk mendapatkan rata-rata rating
  (
    SELECT coalesce(avg(o.rating), 0)::numeric(3,2)
    FROM orders o
    WHERE o.peternak_id = l.peternak_id
      AND o.order_status = 'completed'
      AND o.rating IS NOT NULL
  ) AS average_rating
from listings l
join peternak_details pd on pd.id = l.peternak_id
join profiles p on p.id = pd.profile_id
left join peternak_scores ps on ps.peternak_id = l.peternak_id
where l.is_available = true
  and coalesce(ps.is_suspended, false) = false;
```

Frontend konsumen (halaman Home & smart routing) **wajib query dari VIEW ini**, bukan dari tabel `listings` langsung.

---

## 20. Tabel: `otps` (Custom OTP Mechanism)

Tabel ini digunakan untuk mengelola OTP secara kustom dan menghindari konflik dengan tabel `auth.users` sebelum profil resmi terbentuk.

```sql
create table public.otps (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  otp_code text not null,
  purpose text not null default 'signup',
  expires_at timestamp with time zone not null,
  is_used boolean default false,
  metadata jsonb, -- Menyimpan data registrasi sementara (password, nama, hp, role)
  created_at timestamp with time zone default now()
);

-- Amankan tabel ini agar hanya bisa diakses oleh backend (Service Role)
alter table public.otps enable row level security;
```

---

## 20. Rekomendasi Tambahan

1. **Gunakan Supabase Storage** dengan 2 bucket terpisah: `verification-photos` (privat, hanya bisa diakses backend/CS) dan `delivery-proofs` (bisa diakses konsumen terkait order-nya saja).
2. **Index pada `response_deadline`** (sudah ditambahkan di §11) krusial untuk performa job pengecekan 5-menit — pastikan dipasang sejak awal, jangan ditambahkan belakangan.
3. **Jangan skip VIEW `public_listings`** meski terasa seperti langkah ekstra — ini satu-satunya guardrail yang menjamin janji "stok tersembunyi" di PRD benar-benar terimplementasi di level database, bukan cuma disembunyikan di frontend (yang tetap bisa dibaca lewat Network tab browser).
4. Untuk kebutuhan demo, siapkan **seed data script** (SQL insert) berisi 3–5 peternak dummy dengan lokasi tersebar di Jawa Barat, harga bervariasi, dan score berbeda-beda — supaya smart routing terlihat nyata saat presentasi.

---

## 21. Sistem Saldo Peternak (Wallet)

Ditambahkan pada fitur #5 (`Feat/PeternakWallet`), migration `20260727000000_create_wallet.sql`. Modul buku kas/ledger: pendapatan pesanan selesai mengendap jadi saldo (dipotong biaya admin 3.5% dari `subtotal`), lalu dicairkan ke rekening bank. Transfer bank dilakukan manual di luar sistem (MVP).

### 21.1 Kolom rekening pada `peternak_details`

Tiga kolom baru (nullable, diisi lewat halaman profil peternak):

```sql
alter table peternak_details
  add column bank_name text,
  add column bank_account_number text,
  add column bank_account_holder text;
```

### 21.2 Tabel `wallets`

Saldo berjalan, satu baris per peternak.

```sql
create table wallets (
  peternak_id uuid primary key references peternak_details(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);
```

### 21.3 Tabel `withdrawals`

Pengajuan pencairan. Rekening di-snapshot saat pengajuan agar riwayat tetap benar walau peternak mengubah rekening di profil.

```sql
create table withdrawals (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  bank_name text not null,
  bank_account_number text not null,
  bank_account_holder text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);
```

### 21.4 Tabel `wallet_transactions`

Buku besar (ledger) tiap mutasi. `balance_after` menyimpan snapshot saldo setelah mutasi. Unique index mencegah satu order di-credit lebih dari sekali.

```sql
create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  peternak_id uuid not null references peternak_details(id) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(14,2) not null check (amount > 0),
  balance_after numeric(14,2) not null,
  related_order_id uuid references orders(id),
  related_withdrawal_id uuid references withdrawals(id),
  note text,
  created_at timestamptz not null default now()
);

create unique index uq_wallet_transactions_order
  on wallet_transactions(related_order_id)
  where related_order_id is not null;
```

### 21.5 RLS & Fungsi

- RLS: peternak hanya bisa `select` data (wallet, transaksi, pencairan) miliknya sendiri. Perubahan saldo tidak dilakukan langsung dari client, melainkan lewat fungsi `SECURITY DEFINER`.
- Fungsi:
  - `credit_wallet_from_order(order_id)` — dipanggil saat order `completed`; menambahkan `subtotal × 0.965` ke saldo + catat credit. Idempotent (skip jika order sudah pernah di-credit).
  - `request_withdrawal(peternak_id, amount)` — pencairan instan tanpa persetujuan. Validasi rekening terisi dan `amount ≤ balance`, langsung memotong saldo, membuat `withdrawals` status `completed`, dan mencatat debit di ledger. Mengembalikan id pencairan.
  - `complete_withdrawal(withdrawal_id)` & `reject_withdrawal(withdrawal_id, note)` — legacy dari rancangan approval manual; tidak dipakai pada alur instan saat ini, dibiarkan untuk kebutuhan penyesuaian manual bila diperlukan.

> **Model pencairan:** saldo peternak adalah uang miliknya sendiri, jadi pencairan langsung diproses saat diajukan (tidak ada status `pending`/persetujuan admin). Transfer bank aktual tetap dilakukan manual di luar sistem untuk MVP.

---

**Dokumen terkait:** `prd.md`, `tech_stack.md`, `design_system.md`, `task_division.md`
