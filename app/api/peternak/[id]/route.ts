import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const peternakId = params.id;

    if (!peternakId) {
      return NextResponse.json({ error: 'Missing peternak ID' }, { status: 400 });
    }

    const { data: peternak, error: peternakError } = await supabase
      .from('peternak_details')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        ),
        peternak_scores (
          final_score,
          average_rating
        )
      `)
      .eq('id', peternakId)
      .single();

    if (peternakError || !peternak) {
      return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    const { data: deliverySlots, error: slotsError } = await supabase
      .from('delivery_slots')
      .select('*')
      .eq('peternak_id', peternakId)
      .eq('is_active', true)
      .gte('slot_date', todayDateStr)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 });
    }

    const responseData = {
      profile: peternak,
      delivery_slots: deliverySlots || []
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
