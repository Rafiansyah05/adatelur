-- Seed Data untuk adatelur.com (Dummy Data)

-- 1. Insert Dummy Users ke auth.users (agar foreign key di profiles tidak error)
-- Note: UUID sudah di-hardcode agar relasi antar tabel terjaga.
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  -- Consumers (111...)
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'consumer1@test.com', 'dummy_hash', now(), now(), now()),
  ('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'consumer2@test.com', 'dummy_hash', now(), now(), now()),
  ('11111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'consumer3@test.com', 'dummy_hash', now(), now(), now()),
  -- Peternak (222...)
  ('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'peternak1_bdg@test.com', 'dummy_hash', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'peternak2_bdg@test.com', 'dummy_hash', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222223', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'peternak3_cmh@test.com', 'dummy_hash', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222224', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'peternak4_smd@test.com', 'dummy_hash', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222225', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'peternak5_smd@test.com', 'dummy_hash', now(), now(), now())
ON CONFLICT DO NOTHING;

-- 2. Insert Profiles
INSERT INTO profiles (id, role, full_name, phone_number, email)
VALUES
  -- 3 Consumers
  ('11111111-1111-1111-1111-111111111111', 'consumer', 'Budi Konsumen', '081111111111', 'consumer1@test.com'),
  ('11111111-1111-1111-1111-111111111112', 'consumer', 'Siti Konsumen', '081111111112', 'consumer2@test.com'),
  ('11111111-1111-1111-1111-111111111113', 'consumer', 'Andi Konsumen', '081111111113', 'consumer3@test.com'),
  -- 5 Peternak
  ('22222222-2222-2222-2222-222222222221', 'peternak', 'Peternakan Ayam Bahagia (Bandung 1)', '082222222221', 'peternak1_bdg@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'peternak', 'Peternakan Telur Mas (Bandung 2)', '082222222222', 'peternak2_bdg@test.com'),
  ('22222222-2222-2222-2222-222222222223', 'peternak', 'Sentra Telur Cimahi', '082222222223', 'peternak3_cmh@test.com'),
  ('22222222-2222-2222-2222-222222222224', 'peternak', 'Peternakan Jatinangor (Sumedang 1)', '082222222224', 'peternak4_smd@test.com'),
  ('22222222-2222-2222-2222-222222222225', 'peternak', 'Sumber Telur Tanjungsari (Sumedang 2)', '082222222225', 'peternak5_smd@test.com')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Peternak Details (Pastikan verification_status='approved')
-- ID Peternak Details di-hardcode ke 333... agar mudah di-reference
INSERT INTO peternak_details (id, profile_id, birth_date, farm_address, farm_latitude, farm_longitude, registration_method, chicken_count, daily_egg_production, daily_damaged_eggs, daily_clean_eggs, feed_type, farming_experience_years, has_vehicle, verification_status)
VALUES
  -- Peternak 1: Bandung (Pusat)
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', '1980-01-01', 'Jl. Cibaduyut, Bandung', -6.9458, 107.5947, 'self_form', 5000, 4800, 50, 4750, 'Konsentrat', 5.5, true, 'approved'),
  -- Peternak 2: Bandung (Timur)
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', '1985-05-15', 'Jl. Ujung Berung, Bandung', -6.9157, 107.6970, 'self_form', 3000, 2850, 30, 2820, 'Campuran', 3.0, true, 'approved'),
  -- Peternak 3: Cimahi
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223', '1990-08-20', 'Jl. Cibeber, Cimahi', -6.8837, 107.5342, 'video_call_cs', 10000, 9600, 100, 9500, 'Organik', 8.0, true, 'approved'),
  -- Peternak 4: Sumedang (Jatinangor)
  ('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222224', '1988-11-11', 'Jatinangor, Sumedang', -6.9312, 107.7719, 'self_form', 7500, 7200, 80, 7120, 'Konsentrat', 4.5, false, 'approved'),
  -- Peternak 5: Sumedang (Tanjungsari)
  ('33333333-3333-3333-3333-333333333335', '22222222-2222-2222-2222-222222222225', '1992-02-28', 'Tanjungsari, Sumedang', -6.8972, 107.8209, 'video_call_cs', 4000, 3800, 40, 3760, 'Campuran', 2.0, true, 'approved')
ON CONFLICT (profile_id) DO NOTHING;

-- 4. Insert Peternak Scores (Initial data)
INSERT INTO peternak_scores (peternak_id, total_transaction_value, transaction_score, delivery_accuracy_pct, delivery_score, average_rating, rating_score, final_score)
VALUES
  ('33333333-3333-3333-3333-333333333331', 15000000, 80, 95.0, 95.0, 4.8, 96.0, 87.7),
  ('33333333-3333-3333-3333-333333333332', 5000000, 50, 90.0, 90.0, 4.5, 90.0, 70.0),
  ('33333333-3333-3333-3333-333333333333', 35000000, 100, 98.0, 98.0, 4.9, 98.0, 99.0),
  ('33333333-3333-3333-3333-333333333334', 12000000, 70, 85.0, 85.0, 4.2, 84.0, 77.3),
  ('33333333-3333-3333-3333-333333333335', 8000000, 60, 92.0, 92.0, 4.6, 92.0, 76.0)
ON CONFLICT (peternak_id) DO NOTHING;

-- 5. Insert Listings (1 listing per peternak)
INSERT INTO listings (id, peternak_id, price_per_rak, stock_rak, is_listing_active)
VALUES
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 52000, 100, true),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 53500, 50, true),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 51000, 200, true),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333334', 50500, 150, true),
  ('44444444-4444-4444-4444-444444444445', '33333333-3333-3333-3333-333333333335', 51500, 80, true)
ON CONFLICT (id) DO NOTHING;
