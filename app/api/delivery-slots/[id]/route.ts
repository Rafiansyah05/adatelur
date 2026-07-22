import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const slotId = params.id;
    const body = await request.json();
    const { is_active } = body;

    if (is_active === undefined) {
      return NextResponse.json({ error: 'Missing is_active field' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('delivery_slots')
      .update({ is_active })
      .eq('id', slotId)
      .eq('peternak_id', peternakDetails.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
