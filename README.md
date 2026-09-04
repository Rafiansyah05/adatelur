# adatelur Platform

Platform pemesanan telur untuk menghubungkan peternak dan konsumen.

## Persyaratan
- Node.js 18+ atau versi terbaru.
- Package manager: npm.

## Cara Clone & Instalasi
1. Clone repositori ini:
   ```bash
   git clone https://github.com/Rafiansyah05/adatelur.git
   cd adatelur
   ```
2. Install semua dependencies:
   ```bash
   npm install
   ```
3. Copy file `.env.example` menjadi `.env.local` dan isi nilainya (hubungi tim untuk credentials):
   ```bash
   cp .env.example .env.local
   ```

## Menjalankan Project (Local Development)
Jalankan development server:
```bash
npm run dev
```
Akses `http://localhost:3000` di browser.

## Tech Stack
- Framework: Next.js 14 (App Router)
- Bahasa: TypeScript
- Styling: Tailwind CSS
- Database & Auth: Supabase



database supabase:
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['consumer'::text, 'peternak'::text, 'admin'::text])),
  full_name text NOT NULL,
  phone_number text UNIQUE,
  email text UNIQUE,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.peternak_details_raw (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  birth_date date NOT NULL,
  farm_address text NOT NULL,
  farm_latitude double precision NOT NULL,
  farm_longitude double precision NOT NULL,
  registration_method text NOT NULL CHECK (registration_method = ANY (ARRAY['video_call_cs'::text, 'self_form'::text])),
  chicken_count integer NOT NULL,
  daily_egg_production integer NOT NULL,
  daily_damaged_eggs integer NOT NULL DEFAULT 0,
  daily_clean_eggs integer NOT NULL,
  feed_type text NOT NULL,
  farming_experience_years numeric NOT NULL,
  has_vehicle boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'in_review'::text, 'approved'::text, 'rejected'::text, 'expired'::text])),
  verification_submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  verification_decided_at timestamp with time zone,
  verification_notes text,
  is_active boolean NOT NULL DEFAULT true,
  current_price_per_rak numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  bank_name text,
  bank_account_number_encrypted bytea,
  bank_account_holder text,
  farm_name text DEFAULT 'Peternak Ada Telur'::text,
  CONSTRAINT peternak_details_raw_pkey PRIMARY KEY (id),
  CONSTRAINT peternak_details_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.consumer_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  label text DEFAULT 'Rumah'::text,
  full_address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT consumer_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT consumer_addresses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.peternak_verification_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL,
  photo_type text NOT NULL CHECK (photo_type = ANY (ARRAY['kandang_luar'::text, 'kandang_dalam'::text, 'ayam'::text, 'telur'::text])),
  photo_url text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT peternak_verification_photos_pkey PRIMARY KEY (id),
  CONSTRAINT peternak_verification_photos_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL,
  vehicle_type text NOT NULL,
  plate_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_pkey PRIMARY KEY (id),
  CONSTRAINT vehicles_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL UNIQUE,
  price_per_rak numeric NOT NULL,
  stock_rak integer NOT NULL DEFAULT 0,
  is_available boolean DEFAULT ((stock_rak > 0) AND is_listing_active),
  is_listing_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.daily_production_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  predicted_eggs integer NOT NULL,
  actual_eggs integer,
  confirmed_via text NOT NULL DEFAULT 'whatsapp'::text CHECK (confirmed_via = ANY (ARRAY['whatsapp'::text, 'web'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_production_log_pkey PRIMARY KEY (id),
  CONSTRAINT daily_production_log_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.delivery_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_orders integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT delivery_slots_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_slots_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.peternak_scores (
  peternak_id uuid NOT NULL,
  total_transaction_value numeric NOT NULL DEFAULT 0,
  transaction_score numeric NOT NULL DEFAULT 0,
  delivery_accuracy_pct numeric NOT NULL DEFAULT 0,
  delivery_score numeric NOT NULL DEFAULT 0,
  average_rating numeric NOT NULL DEFAULT 0,
  rating_score numeric NOT NULL DEFAULT 0,
  final_score numeric NOT NULL DEFAULT 0,
  is_suspended boolean NOT NULL DEFAULT false,
  suspended_at timestamp with time zone,
  suspension_reason text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT peternak_scores_pkey PRIMARY KEY (peternak_id),
  CONSTRAINT peternak_scores_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.price_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL,
  peternak_price numeric NOT NULL,
  market_reference_price numeric NOT NULL,
  deviation_pct numeric NOT NULL,
  direction text NOT NULL CHECK (direction = ANY (ARRAY['naik'::text, 'turun'::text])),
  notified_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT price_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT price_alerts_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE,
  consumer_id uuid NOT NULL,
  peternak_id uuid NOT NULL,
  listing_id uuid NOT NULL,
  rak_quantity integer NOT NULL CHECK (rak_quantity >= 1),
  price_per_rak numeric NOT NULL,
  subtotal numeric NOT NULL,
  fulfillment_method text NOT NULL CHECK (fulfillment_method = ANY (ARRAY['pickup'::text, 'delivery'::text])),
  distance_km numeric,
  ongkir_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  delivery_slot_id uuid,
  consumer_address_id uuid,
  payment_status text NOT NULL DEFAULT 'unpaid'::text CHECK (payment_status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'refunded'::text])),
  payment_method text,
  payment_reference text,
  order_status text NOT NULL DEFAULT 'waiting'::text CHECK (order_status = ANY (ARRAY['waiting'::text, 'accepted'::text, 'rejected'::text, 'expired'::text, 'in_delivery'::text, 'completed'::text, 'cancelled'::text])),
  responded_at timestamp with time zone,
  response_deadline timestamp with time zone NOT NULL,
  push_notif_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_consumer_id_fkey FOREIGN KEY (consumer_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id),
  CONSTRAINT orders_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id),
  CONSTRAINT orders_delivery_slot_id_fkey FOREIGN KEY (delivery_slot_id) REFERENCES public.delivery_slots(id),
  CONSTRAINT orders_consumer_address_id_fkey FOREIGN KEY (consumer_address_id) REFERENCES public.consumer_addresses(id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  status text NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.delivery_proof (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  photo_url text NOT NULL,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  is_within_slot boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  latitude numeric,
  longitude numeric,
  CONSTRAINT delivery_proof_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_proof_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  consumer_id uuid NOT NULL,
  peternak_id uuid NOT NULL,
  rating_value integer NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
  review_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT ratings_consumer_id_fkey FOREIGN KEY (consumer_id) REFERENCES public.profiles(id),
  CONSTRAINT ratings_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.notifications_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel = ANY (ARRAY['whatsapp'::text, 'push_pwa'::text, 'in_app'::text])),
  notif_type text NOT NULL,
  payload jsonb,
  related_order_id uuid,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  delivery_status text DEFAULT 'sent'::text CHECK (delivery_status = ANY (ARRAY['sent'::text, 'failed'::text, 'read'::text])),
  CONSTRAINT notifications_log_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_log_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_log_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.otps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  purpose text NOT NULL DEFAULT 'signup'::text,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otps_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wallets (
  peternak_id uuid NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (peternak_id),
  CONSTRAINT wallets_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.withdrawals_raw (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  bank_name text NOT NULL,
  bank_account_holder text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'rejected'::text])),
  note text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  bank_account_number_encrypted bytea,
  CONSTRAINT withdrawals_raw_pkey PRIMARY KEY (id),
  CONSTRAINT withdrawals_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id)
);
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  peternak_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['credit'::text, 'debit'::text])),
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  balance_after numeric NOT NULL,
  related_order_id uuid,
  related_withdrawal_id uuid,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_peternak_id_fkey FOREIGN KEY (peternak_id) REFERENCES public.peternak_details_raw(id),
  CONSTRAINT wallet_transactions_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES public.orders(id),
  CONSTRAINT wallet_transactions_related_withdrawal_id_fkey FOREIGN KEY (related_withdrawal_id) REFERENCES public.withdrawals_raw(id)
);
