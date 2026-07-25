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
    const activeSlots: string[] = body.activeSlots || []; // e.g. ["09:00 - 12:00", "12:00 - 15:00"]

    const adminClient = createAdminClient();

    // 1. Delete all existing slots for this peternak
    const { error: deleteError } = await adminClient
      .from('delivery_slots')
      .delete()
      .eq('peternak_id', peternakDetail.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 2. Insert new active slots
    if (activeSlots.length > 0) {
      const slotsToInsert = activeSlots.map((slotStr) => {
        const [start, end] = slotStr.split(' - ');
        return {
          peternak_id: peternakDetail.id,
          start_time: start.trim(),
          end_time: end.trim(),
          is_active: true,
        };
      });

      const { error: insertError } = await adminClient
        .from('delivery_slots')
        .insert(slotsToInsert);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Slots updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
