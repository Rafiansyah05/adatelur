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

    const { data: peternakDetail, error: detailError } = await supabase
      .from('peternak_details')
      .select(`
        id, 
        bank_name, 
        bank_account_number, 
        bank_account_holder,
        created_at,
        profiles (
          full_name
        )
      `)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (detailError) {
      console.error(detailError);
    }

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

    let fullName = 'Peternak';
    if (peternakDetail.profiles) {
      if (Array.isArray(peternakDetail.profiles)) {
        fullName = peternakDetail.profiles[0]?.full_name || 'Peternak';
      } else {
        fullName = (peternakDetail.profiles as any).full_name || 'Peternak';
      }
    }

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
      peternak: {
        full_name: fullName,
        created_at: peternakDetail.created_at || user.created_at,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
