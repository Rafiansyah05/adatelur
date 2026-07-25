import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    const supabase = createAdminClient();
    
    // Check current status
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status, order_status')
      .eq('id', order_id)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    // Only expire if it's currently pending/unpaid
    if (order.payment_status === 'pending' || order.payment_status === 'unpaid') {
      await supabase.from('orders').update({
        payment_status: 'failed',
        order_status: 'dibatalkan'
      }).eq('id', order_id);

      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'dibatalkan',
        note: 'Pembayaran QRIS kadaluarsa (otomatis dibatalkan)'
      });
      
      return NextResponse.json({ success: true, status: 'expired' });
    }

    return NextResponse.json({ success: true, status: order.payment_status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
