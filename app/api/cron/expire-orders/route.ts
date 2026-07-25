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
        note: 'Batas waktu respon habis (5 menit)',
        created_at: now
      }));

      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert(historyInserts);

      if (historyError) throw historyError;

      processed = orderIds.length;
    }

    // 4. Mark orders that need a push notification (waiting > 3 mins)
    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    
    // Find waiting orders > 3 mins old with no push_notif_sent_at
    const { data: pushOrders, error: pushFindErr } = await supabase
      .from('orders')
      .select('id')
      .eq('order_status', 'waiting')
      .is('push_notif_sent_at', null)
      .lt('created_at', threeMinsAgo);

    let pushProcessed = 0;
    
    if (pushOrders && pushOrders.length > 0 && !pushFindErr) {
      const pushIds = pushOrders.map(o => o.id);
      await supabase
        .from('orders')
        .update({ push_notif_sent_at: now })
        .in('id', pushIds);
        
      pushProcessed = pushIds.length;
    }

    return NextResponse.json({ 
      success: true, 
      expired_count: processed,
      push_notif_marked_count: pushProcessed,
      timestamp: now 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
