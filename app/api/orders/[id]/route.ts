import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orderId = params.id;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // authorize: consumer (owner) or peternak owner
    if (order.consumer_id !== user.id) {
      const { data: peternakDetail, error: pdErr } = await supabase
        .from('peternak_details')
        .select('profile_id')
        .eq('id', order.peternak_id)
        .maybeSingle();

      if (pdErr) return NextResponse.json({ error: pdErr.message }, { status: 500 });
      if (!peternakDetail || peternakDetail.profile_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data: history, error: histErr } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (histErr) return NextResponse.json({ error: histErr.message }, { status: 500 });

    return NextResponse.json({ success: true, order, history, data: { order, history } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
