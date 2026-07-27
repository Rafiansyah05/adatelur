import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: peternakDetail } = await supabase
      .from('peternak_details')
      .select('id, bank_name, bank_account_number, bank_account_holder')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!peternakDetail) {
      return NextResponse.json({ error: 'Peternak tidak ditemukan' }, { status: 403 });
    }

    const admin = createAdminClient();

    const { data: wallet } = await admin
      .from('wallets')
      .select('balance')
      .eq('peternak_id', peternakDetail.id)
      .maybeSingle();

    const balance = Number(wallet?.balance ?? 0);

    const { data: pendingRows } = await admin
      .from('withdrawals')
      .select('amount')
      .eq('peternak_id', peternakDetail.id)
      .eq('status', 'pending');

    const pending = (pendingRows ?? []).reduce(
      (sum: number, row: { amount: number }) => sum + Number(row.amount),
      0
    );

    const { data: transactions } = await admin
      .from('wallet_transactions')
      .select('*')
      .eq('peternak_id', peternakDetail.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: withdrawals } = await admin
      .from('withdrawals')
      .select('*')
      .eq('peternak_id', peternakDetail.id)
      .order('requested_at', { ascending: false })
      .limit(50);

    const bankFilled = Boolean(
      peternakDetail.bank_name &&
        peternakDetail.bank_account_number &&
        peternakDetail.bank_account_holder
    );

    return NextResponse.json({
      balance,
      pending,
      available: balance - pending,
      bank: {
        filled: bankFilled,
        bank_name: peternakDetail.bank_name,
        bank_account_number: peternakDetail.bank_account_number,
        bank_account_holder: peternakDetail.bank_account_holder,
      },
      transactions: transactions ?? [],
      withdrawals: withdrawals ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
