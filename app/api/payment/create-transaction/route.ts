import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: 'order_id wajib diisi' }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, consumer:profiles!orders_consumer_id_fkey(full_name, phone_number, email)')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    if (order.consumer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Server key from Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-placeholder';
    const authString = Buffer.from(`${serverKey}:`).toString('base64');

    const payload = {
      transaction_details: {
        order_id: order.id,
        gross_amount: Math.round(Number(order.total_amount))
      },
      customer_details: {
        first_name: order.consumer.full_name,
        email: order.consumer.email || 'user@example.com',
        phone: order.consumer.phone_number
      }
    };

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // In case Midtrans fails, for MVP we can simulate success to not block testing if no real key is set
      console.warn('Midtrans Error:', data);
      if (!process.env.MIDTRANS_SERVER_KEY) {
        return NextResponse.json({ 
          token: 'dummy-token-for-testing',
          redirect_url: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/dummy' 
        });
      }
      throw new Error(data.error_messages ? data.error_messages[0] : 'Gagal membuat transaksi Midtrans');
    }

    return NextResponse.json({ 
      token: data.token,
      redirect_url: data.redirect_url
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
