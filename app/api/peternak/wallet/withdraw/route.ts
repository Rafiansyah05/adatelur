import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
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
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!peternakDetail) {
      return NextResponse.json({ error: 'Peternak tidak ditemukan' }, { status: 403 });
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Jumlah pencairan tidak valid' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('request_withdrawal', {
      p_peternak_id: peternakDetail.id,
      p_amount: amount,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, withdrawal_id: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
