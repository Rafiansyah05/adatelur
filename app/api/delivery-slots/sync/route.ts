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
    const activeSlots: string[] = body.activeSlots || [];

    const adminClient = createAdminClient();


    const { data: existingSlots, error: fetchSlotsError } = await adminClient
      .from('delivery_slots')
      .select('id, start_time, end_time, is_active')
      .eq('peternak_id', peternakDetail.id);

    if (fetchSlotsError) {
      return NextResponse.json({ error: fetchSlotsError.message }, { status: 500 });
    }


    const { data: referencedOrders, error: referencedOrdersError } = await adminClient
      .from('orders')
      .select('delivery_slot_id')
      .eq('peternak_id', peternakDetail.id)
      .not('delivery_slot_id', 'is', null);

    if (referencedOrdersError) {
      return NextResponse.json({ error: referencedOrdersError.message }, { status: 500 });
    }

    const referencedSlotIds = new Set((referencedOrders ?? []).map((o) => o.delivery_slot_id));


    const activeParsed = activeSlots.map((slotStr) => {
      const [start, end] = slotStr.split(' - ');
      return {
        start: start.trim(),
        end: end.trim(),
      };
    });

    const slotsToInsert = [];
    const slotsToActivate = [];
    const slotsToDeactivate = [];
    const slotsToDelete = [];


    for (const existing of existingSlots ?? []) {
      const formattedStartTime = existing.start_time.substring(0, 5);
      const formattedEndTime = existing.end_time.substring(0, 5);

      const isActiveInInput = activeParsed.some(
        (a) =>
          a.start.substring(0, 5) === formattedStartTime &&
          a.end.substring(0, 5) === formattedEndTime
      );

      if (isActiveInInput) {
        if (!existing.is_active) {
          slotsToActivate.push(existing.id);
        }
      } else {

        if (referencedSlotIds.has(existing.id)) {
          if (existing.is_active) {
            slotsToDeactivate.push(existing.id);
          }
        } else {
          slotsToDelete.push(existing.id);
        }
      }
    }

    for (const active of activeParsed) {
      const alreadyExists = (existingSlots ?? []).some(
        (e) =>
          e.start_time.substring(0, 5) === active.start.substring(0, 5) &&
          e.end_time.substring(0, 5) === active.end.substring(0, 5)
      );

      if (!alreadyExists) {
        slotsToInsert.push({
          peternak_id: peternakDetail.id,
          start_time: active.start,
          end_time: active.end,
          is_active: true,
        });
      }
    }

    if (slotsToDelete.length > 0) {
      const { error: delErr } = await adminClient
        .from('delivery_slots')
        .delete()
        .in('id', slotsToDelete);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    if (slotsToDeactivate.length > 0) {
      const { error: deactErr } = await adminClient
        .from('delivery_slots')
        .update({ is_active: false })
        .in('id', slotsToDeactivate);
      if (deactErr) return NextResponse.json({ error: deactErr.message }, { status: 500 });
    }

    if (slotsToActivate.length > 0) {
      const { error: actErr } = await adminClient
        .from('delivery_slots')
        .update({ is_active: true })
        .in('id', slotsToActivate);
      if (actErr) return NextResponse.json({ error: actErr.message }, { status: 500 });
    }

    if (slotsToInsert.length > 0) {
      const { error: insErr } = await adminClient.from('delivery_slots').insert(slotsToInsert);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Slots updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
