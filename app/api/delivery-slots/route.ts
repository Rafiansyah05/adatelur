import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: peternakDetails, error: detailsError } = await supabase
      .from('peternak_details')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (detailsError || !peternakDetails) {
      return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
    }

    const body = await request.json();
    const { slot_date, start_time, end_time } = body;

    if (!slot_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('delivery_slots')
      .insert({
        peternak_id: peternakDetails.id,
        slot_date,
        start_time,
        end_time,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
