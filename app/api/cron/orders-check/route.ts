import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();

    // expire orders past deadline
    const { data: expiredOrders, error: expErr } = await supabase
      .from('orders')
      .select('id')
      .eq('order_status', 'waiting')
      .lt('response_deadline', new Date().toISOString());

    if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

    if (expiredOrders && expiredOrders.length > 0) {
      const ids = expiredOrders.map((o: any) => o.id);
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ order_status: 'expired', updated_at: new Date().toISOString() })
        .in('id', ids);

      if (updateErr) console.error('Failed to mark orders expired', updateErr.message);

      // insert histories
      const histories = ids.map((id: string) => ({
        order_id: id,
        status: 'expired',
        note: 'Auto-expired by scheduler',
        created_at: new Date().toISOString(),
      }));
      const { error: histErr } = await supabase.from('order_status_history').insert(histories);
      if (histErr)
        console.error('Failed to insert order history for expired orders', histErr.message);
    }

    return NextResponse.json({
      success: true,
      expired: expiredOrders?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
