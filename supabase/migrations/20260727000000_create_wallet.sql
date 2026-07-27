alter table peternak_details
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_holder text;

create table if not exists wallets (
  peternak_id uuid primary key references peternak_details(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists withdrawals (
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

create index if not exists idx_withdrawals_peternak on withdrawals(peternak_id);
create index if not exists idx_withdrawals_status on withdrawals(status);

create table if not exists wallet_transactions (
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

create index if not exists idx_wallet_transactions_peternak on wallet_transactions(peternak_id);

create unique index if not exists uq_wallet_transactions_order
  on wallet_transactions(related_order_id)
  where related_order_id is not null;

alter table wallets enable row level security;
create policy "peternak reads own wallet" on wallets for select
  using (auth.uid() = (select profile_id from peternak_details where id = peternak_id));

alter table wallet_transactions enable row level security;
create policy "peternak reads own wallet transactions" on wallet_transactions for select
  using (auth.uid() = (select profile_id from peternak_details where id = peternak_id));

alter table withdrawals enable row level security;
create policy "peternak reads own withdrawals" on withdrawals for select
  using (auth.uid() = (select profile_id from peternak_details where id = peternak_id));

create or replace function credit_wallet_from_order(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_peternak_id uuid;
  v_subtotal numeric(14,2);
  v_credit numeric(14,2);
  v_new_balance numeric(14,2);
begin
  select peternak_id, subtotal into v_peternak_id, v_subtotal
  from orders
  where id = p_order_id and order_status = 'completed';

  if v_peternak_id is null then
    return;
  end if;

  if exists (select 1 from wallet_transactions where related_order_id = p_order_id) then
    return;
  end if;

  v_credit := round(v_subtotal * 0.965, 2);

  insert into wallets (peternak_id, balance)
  values (v_peternak_id, 0)
  on conflict (peternak_id) do nothing;

  update wallets
  set balance = balance + v_credit, updated_at = now()
  where peternak_id = v_peternak_id
  returning balance into v_new_balance;

  insert into wallet_transactions (peternak_id, type, amount, balance_after, related_order_id, note)
  values (v_peternak_id, 'credit', v_credit, v_new_balance, p_order_id, 'Pendapatan pesanan (potong admin 3.5%)');
end;
$$;

create or replace function request_withdrawal(p_peternak_id uuid, p_amount numeric)
returns uuid
language plpgsql
security definer
as $$
declare
  v_bank_name text;
  v_bank_account_number text;
  v_bank_account_holder text;
  v_balance numeric(14,2);
  v_new_balance numeric(14,2);
  v_id uuid;
begin
  select bank_name, bank_account_number, bank_account_holder
  into v_bank_name, v_bank_account_number, v_bank_account_holder
  from peternak_details
  where id = p_peternak_id;

  if v_bank_name is null or v_bank_account_number is null or v_bank_account_holder is null then
    raise exception 'Rekening bank belum diisi';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Jumlah pencairan tidak valid';
  end if;

  select coalesce(balance, 0) into v_balance from wallets where peternak_id = p_peternak_id;
  v_balance := coalesce(v_balance, 0);

  if p_amount > v_balance then
    raise exception 'Saldo tidak cukup';
  end if;

  update wallets
  set balance = balance - p_amount, updated_at = now()
  where peternak_id = p_peternak_id
  returning balance into v_new_balance;

  insert into withdrawals (peternak_id, amount, bank_name, bank_account_number, bank_account_holder, status, processed_at)
  values (p_peternak_id, p_amount, v_bank_name, v_bank_account_number, v_bank_account_holder, 'completed', now())
  returning id into v_id;

  insert into wallet_transactions (peternak_id, type, amount, balance_after, related_withdrawal_id, note)
  values (p_peternak_id, 'debit', p_amount, v_new_balance, v_id, 'Pencairan saldo');

  return v_id;
end;
$$;

create or replace function complete_withdrawal(p_withdrawal_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_peternak_id uuid;
  v_amount numeric(14,2);
  v_status text;
  v_new_balance numeric(14,2);
begin
  select peternak_id, amount, status
  into v_peternak_id, v_amount, v_status
  from withdrawals
  where id = p_withdrawal_id;

  if v_peternak_id is null then
    raise exception 'Pencairan tidak ditemukan';
  end if;

  if v_status <> 'pending' then
    raise exception 'Pencairan sudah diproses';
  end if;

  update wallets
  set balance = balance - v_amount, updated_at = now()
  where peternak_id = v_peternak_id
  returning balance into v_new_balance;

  if v_new_balance is null or v_new_balance < 0 then
    raise exception 'Saldo tidak cukup';
  end if;

  insert into wallet_transactions (peternak_id, type, amount, balance_after, related_withdrawal_id, note)
  values (v_peternak_id, 'debit', v_amount, v_new_balance, p_withdrawal_id, 'Pencairan saldo');

  update withdrawals
  set status = 'completed', processed_at = now()
  where id = p_withdrawal_id;
end;
$$;

create or replace function reject_withdrawal(p_withdrawal_id uuid, p_note text)
returns void
language plpgsql
security definer
as $$
begin
  update withdrawals
  set status = 'rejected', note = p_note, processed_at = now()
  where id = p_withdrawal_id and status = 'pending';
end;
$$;
