import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id missing' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    let newPaymentStatus = 'unpaid';

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        newPaymentStatus = 'paid';
      }
    } else if (transaction_status === 'settlement') {
      newPaymentStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newPaymentStatus = 'failed';
    }

    const { data: order } = await supabase
      .from('orders')
      .select('id, peternak_id')
      .eq('payment_reference', order_id)
      .single();

    if (!order?.id) {
      return NextResponse.json({ success: true });
    }

    const updatePayload: Record<string, any> = {
      payment_status: newPaymentStatus,
      updated_at: now,
      peternak_id: order.peternak_id
    };

    if (newPaymentStatus === 'paid') {
      updatePayload.order_status = 'diproses';
    }

    await supabase.from('orders').update(updatePayload).eq('id', order.id);

    if (newPaymentStatus === 'paid') {
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'diproses',
        note: 'Pembayaran berhasil via webhook Midtrans'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
