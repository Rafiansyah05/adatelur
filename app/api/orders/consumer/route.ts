import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUser = createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: myOrders, error } = await supabase
      .from('orders')
      .select(`
        *,
        peternak:peternak_details(farm_address, farm_latitude, farm_longitude, profile:profiles(full_name, phone_number)),
        delivery_slot:delivery_slots(start_time, end_time),
        delivery_proof(photo_url, captured_at)
      `)
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: myOrders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
