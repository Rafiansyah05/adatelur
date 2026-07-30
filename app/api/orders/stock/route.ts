import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const { listingId, peternakId } = await request.json();
    if (!listingId || !peternakId) return NextResponse.json({ error: 'Missing ids' }, { status: 400 });

    const { data: listing } = await supabase
      .from('listings')
      .select('stock_rak, updated_at')
      .eq('id', listingId)
      .single();

    const startOfTodayMs = new Date(new Date().setHours(0,0,0,0)).getTime();
    const listingUpdatedMs = listing?.updated_at ? new Date(listing.updated_at).getTime() : 0;
    const cutoffTime = new Date(Math.max(startOfTodayMs, listingUpdatedMs)).toISOString();

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('rak_quantity')
      .eq('peternak_id', peternakId)
      .eq('payment_status', 'paid')
      .gte('created_at', cutoffTime);

    const soldToday = (recentOrders ?? []).reduce((sum, o) => sum + Number(o.rak_quantity), 0);
    const initialStock = listing?.stock_rak || 0;
    const remainingStock = Math.max(0, initialStock - soldToday);

    return NextResponse.json({ data: { remainingStock, initialStock, soldToday } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
