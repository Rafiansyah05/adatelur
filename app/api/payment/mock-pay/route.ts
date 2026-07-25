import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    // Hanya untuk testing di environment non-production!
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
    }

    const { order_id } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status, peternak_id')
      .eq('id', order_id)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    // Simulate successful payment
    await supabase.from('orders').update({
      payment_status: 'paid',
      order_status: 'diproses',
      peternak_id: order.peternak_id
    }).eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'diproses',
      note: 'Pembayaran otomatis berhasil (Mode Testing)'
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
