create table orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,                  -- human-readable, e.g. "ADT-20260721-0001"

  consumer_id uuid not null references profiles(id),
  peternak_id uuid not null references peternak_details(id),
  listing_id uuid not null references listings(id),

  rak_quantity integer not null check (rak_quantity >= 1),
  price_per_rak numeric(10,2) not null,             -- snapshot harga saat order dibuat
  subtotal numeric(10,2) not null,                  -- price_per_rak * rak_quantity

  fulfillment_method text not null check (fulfillment_method in ('pickup', 'delivery')),
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

-- RLS orders
alter table orders enable row level security;
create policy "consumer sees own orders" on orders for select using (auth.uid() = consumer_id);
create policy "peternak sees own orders" on orders for select
  using (auth.uid() = (select profile_id from peternak_details where id = peternak_id));

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index idx_order_status_history_order on order_status_history(order_id);

create table delivery_proof (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  photo_url text not null,                          -- Supabase Storage path
  captured_at timestamptz not null default now(),
  is_within_slot boolean,                            -- dihitung: captured_at masih dalam range delivery_slot?
  created_at timestamptz not null default now()
);

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
