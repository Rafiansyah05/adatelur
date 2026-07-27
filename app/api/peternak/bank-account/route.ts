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
    const bankName = String(body.bank_name || '').trim();
    const accountNumber = String(body.bank_account_number || '').trim();
    const accountHolder = String(body.bank_account_holder || '').trim();

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json({ error: 'Semua data rekening wajib diisi' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('peternak_details')
      .update({
        bank_name: bankName,
        bank_account_number: accountNumber,
        bank_account_holder: accountHolder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', peternakDetail.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
