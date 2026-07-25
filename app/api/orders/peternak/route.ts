import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const peternakId = searchParams.get('peternakId');

    if (!peternakId) {
      return NextResponse.json({ error: 'Missing peternakId' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: myOrders, error } = await supabase
      .from('orders')
      .select(`
        *,
        consumer:profiles!orders_consumer_id_fkey(full_name, phone_number),
        consumer_address:consumer_addresses(latitude, longitude),
        delivery_slot:delivery_slots(start_time, end_time)
      `)
      .eq('peternak_id', peternakId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: myOrders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
