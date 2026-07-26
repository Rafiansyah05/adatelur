import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderCancelledNotif } from '@/lib/orderNotif';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orderId = params.id;
    const body = await request.json();
    const action = body.action;

    if (!['accept', 'reject', 'cancel'].includes(action))
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    // load order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (action === 'cancel') {
      // verify current user is consumer owner of this order
      if (order.consumer_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      // verify current user is peternak owner of this order
      const { data: peternakDetail, error: pdErr } = await supabase
        .from('peternak_details')
        .select('id, profile_id')
        .eq('id', order.peternak_id)
        .maybeSingle();

      if (pdErr) return NextResponse.json({ error: pdErr.message }, { status: 500 });
      if (!peternakDetail)
        return NextResponse.json({ error: 'Peternak detail not found' }, { status: 404 });
      if (peternakDetail.profile_id !== user.id)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.order_status !== 'waiting')
      return NextResponse.json(
        { error: 'Order cannot be responded (not waiting)' },
        { status: 400 }
      );

    const now = new Date();
    if (order.response_deadline && new Date(order.response_deadline) < now) {
      if (action !== 'cancel') {
        return NextResponse.json({ error: 'order sudah expired' }, { status: 400 });
      }
    }

    let newStatus = action === 'accept' ? 'accepted' : 'rejected';
    if (action === 'cancel') newStatus = 'cancelled';
    
    // We import createAdminClient at the top if it's missing, let's assume it's imported? 
    // Oh wait, createAdminClient is NOT imported in this file. Let's require it locally or import it.
    // wait, I must check imports at the top!
    const { createAdminClient: getAdmin } = await import('@/lib/supabase/admin');
    const adminSupabase = getAdmin();

    const { data: updated, error: updateErr } = await adminSupabase
      .from('orders')
      .update({
        order_status: newStatus,
        responded_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    const { error: histErr } = await adminSupabase.from('order_status_history').insert({
      order_id: orderId,
      status: newStatus,
      note: action === 'cancel' ? 'Konsumen membatalkan' : `Peternak ${action}`,
      created_at: now.toISOString(),
    });

    if (histErr) console.error('Failed to insert order history', histErr.message);

    if (newStatus === 'cancelled') {
      await sendOrderCancelledNotif(orderId);
    }

    return NextResponse.json({ success: true, order: updated, data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
