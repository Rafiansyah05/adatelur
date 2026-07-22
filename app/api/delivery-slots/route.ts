import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: peternakDetail, error: peternakError } = await supabase
      .from('peternak_details')
      .select('id, verification_status')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (peternakError) {
      return NextResponse.json({ error: peternakError.message }, { status: 500 });
    }

    if (!peternakDetail || peternakDetail.verification_status !== 'approved') {
      return NextResponse.json({ error: 'Akun peternak belum disetujui' }, { status: 403 });
    }

    const body = await request.json();
    const slotDate = body.slot_date || body.slotDate;
    const startTime = body.start_time || body.startTime;
    const endTime = body.end_time || body.endTime;
    const isActive = body.is_active ?? true;

    if (!slotDate || !startTime || !endTime) {
      return NextResponse.json({ error: 'Tanggal dan jam slot wajib diisi' }, { status: 400 });
    }

    const { data: slot, error: slotError } = await supabase
      .from('delivery_slots')
      .insert({
        peternak_id: peternakDetail.id,
        slot_date: slotDate,
        start_time: startTime,
        end_time: endTime,
        is_active: isActive,
      })
      .select()
      .single();

    if (slotError) {
      return NextResponse.json({ error: slotError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slot, data: slot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
