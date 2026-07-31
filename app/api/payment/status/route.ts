import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import midtransClient from 'midtrans-client';
import { sendOrderPaidNotif } from '@/lib/orderNotif';

const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

export async function POST(req: Request) {
  try {
    let { order_id } = await req.json();
    if (Array.isArray(order_id)) order_id = order_id[0];
    if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    const isMidtransId = order_id.startsWith('ADT-');
    const supabase = createAdminClient();

    let query = supabase
      .from('orders')
      .select('id, payment_reference, payment_status, order_status, peternak_id');

    if (isMidtransId) {
      query = query.eq('payment_reference', order_id);
    } else {
      query = query.eq('id', order_id);
    }

    const { data: order } = await query.single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.payment_status === 'paid') {
      return NextResponse.json({ success: true, status: 'paid' });
    }

    if (!order.payment_reference) {
      return NextResponse.json({ success: true, status: 'unpaid' });
    }

    try {
      const midtransResponse = await coreApi.transaction.status(order.payment_reference);
      const txStatus = midtransResponse.transaction_status;

      if (['settlement', 'capture', 'success'].includes(txStatus)) {
        await supabase.from('orders').update({
          payment_status: 'paid',
          peternak_id: order.peternak_id
        }).eq('id', order.id);

        await supabase.from('order_status_history').insert({
          order_id: order.id,
          status: 'accepted',
          note: 'Pembayaran QRIS berhasil'
        });

        await sendOrderPaidNotif(order.id);

        return NextResponse.json({ success: true, status: 'paid' });
      }

      if (['expire', 'cancel', 'deny'].includes(txStatus)) {
        await supabase.from('orders').update({
          payment_status: 'failed',
          peternak_id: order.peternak_id
        }).eq('id', order.id);

        return NextResponse.json({ success: true, status: 'expired' });
      }

      return NextResponse.json({ success: true, status: 'pending' });
    } catch (midtransErr: any) {
      if (midtransErr.message?.includes('404') || midtransErr.httpStatusCode === 404) {
        return NextResponse.json({ success: true, status: 'pending' });
      }
      throw midtransErr;
    }
  } catch (err: any) {
    console.error('Status Check Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
