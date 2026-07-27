import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Vercel Cron Endpoint (or callable by any scheduler)
export async function GET(request: Request) {
  try {
    // Optionally: verify authorization header for Vercel Cron if in production
    if (
      process.env.NODE_ENV === 'production' &&
      request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // 1. Find orders that are 'waiting' and past their response_deadline
    const { data: expiredOrders, error: findError } = await supabase
      .from('orders')
      .select('id')
      .eq('order_status', 'waiting')
      .lt('response_deadline', now);

    if (findError) throw findError;

    let processed = 0;

    if (expiredOrders && expiredOrders.length > 0) {
      const orderIds = expiredOrders.map(o => o.id);

      // 2. Update status to 'expired'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ order_status: 'expired', updated_at: now })
        .in('id', orderIds);

      if (updateError) throw updateError;

      // 3. Insert into order_status_history
      const historyInserts = orderIds.map(id => ({
        order_id: id,
        status: 'expired',
        note: 'Batas waktu respon habis (3 menit)',
        created_at: now
      }));

      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert(historyInserts);

      if (historyError) throw historyError;

      processed = orderIds.length;
    }

    return NextResponse.json({
      success: true,
      expired_count: processed,
      timestamp: now
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
