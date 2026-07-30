import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// @ts-ignore
import midtransClient from 'midtrans-client';

const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
});

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check if order exists and belongs to user
    const { data: order } = await adminSupabase
      .from('orders')
      .select('*, consumer:profiles!orders_consumer_id_fkey(full_name)')
      .eq('id', order_id)
      .eq('consumer_id', user.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.order_status !== 'accepted') {
      return NextResponse.json({ error: 'Order is not ready for payment' }, { status: 400 });
    }

    // Midtrans Qris Transaction
    const grossAmount = Math.round(Number(order.total_amount) * 1.015); // + 1.5% fee
    const midtransOrderId = `ADT-${order_id.substring(0, 8)}-${Date.now()}`;

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const parameter = {
      payment_type: isProduction ? 'qris' : 'gopay',
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: order.consumer.full_name || 'Pelanggan',
        email: user.email || 'customer@adatelur'
      },
      item_details: [{
        id: order_id,
        price: grossAmount,
        quantity: 1,
        name: `Pembayaran Adatelur - ${order_id.substring(0, 8)}`
      }],
      custom_expiry: {
        order_time: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' +0000',
        expiry_duration: 15,
        unit: 'minute'
      }
    };

    const chargeResponse = await coreApi.charge(parameter);

    if (chargeResponse.status_code !== '201') {
      throw new Error('Failed to generate QRIS from Midtrans: ' + chargeResponse.status_message);
    }

    // Update order with midtrans_order_id
    const { error: updateError } = await adminSupabase.from('orders').update({
      payment_reference: midtransOrderId
    }).eq('id', order.id);

    if (updateError) {
      console.error('Failed to update DB payment_reference:', updateError);
      throw new Error('Failed to save QRIS reference');
    }

    const publicQrisAction = chargeResponse.actions?.find((a: any) => a.name === 'generate-qr-code-v2');
    const defaultQrisAction = chargeResponse.actions?.find((a: any) => a.name === 'generate-qr-code');
    const deeplinkAction = chargeResponse.actions?.find((a: any) => a.name === 'deeplink-redirect');
    const qrisUrl = publicQrisAction?.url || defaultQrisAction?.url || chargeResponse.actions?.[0]?.url;

    return NextResponse.json({
      success: true,
      qris_url: qrisUrl,
      qr_string: chargeResponse.qr_string || null,
      deeplink_url: deeplinkAction?.url || null,
      gross_amount: grossAmount,
      midtrans_order_id: midtransOrderId,
      is_public_url: !!publicQrisAction
    });

  } catch (err: any) {
    console.error('QRIS Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
