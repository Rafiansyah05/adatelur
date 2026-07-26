import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderPaidNotif } from '@/lib/orderNotif';

export async function POST(req: Request) {
  // Hanya izinkan di environment non-production atau jika isProduction false
  if (process.env.MIDTRANS_IS_PRODUCTION === 'true') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    const supabase = createAdminClient();

    const { data: order } = await supabase
      .from('orders')
      .select('id, peternak_id')
      .eq('id', order_id)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Update status pesanan jadi paid
    await supabase.from('orders').update({
      payment_status: 'paid'
    }).eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'accepted',
      note: 'Pembayaran disimulasikan (Sandbox Bypass)'
    });

    await sendOrderPaidNotif(order.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Mock Simulate Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
