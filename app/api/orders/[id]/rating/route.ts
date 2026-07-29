import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recalculatePeternakScore } from '@/lib/scoring';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseUser = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const body = await request.json();
    const rating = Number(body.rating);

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: order, error: orderErr } = await adminSupabase
      .from('orders')
      .select('id, consumer_id, order_status, rating, peternak_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.consumer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to rate this order' }, { status: 403 });
    }

    if (order.order_status !== 'completed') {
      return NextResponse.json({ error: 'Pesanan belum selesai, tidak dapat memberi rating' }, { status: 400 });
    }

    if (order.rating !== null) {
      return NextResponse.json({ error: 'Pesanan ini sudah diberi rating' }, { status: 400 });
    }

    const { error: updateErr } = await adminSupabase
      .from('orders')
      .update({ rating })
      .eq('id', orderId);

    if (updateErr) {
      return NextResponse.json({ error: 'Gagal menyimpan rating pesanan' }, { status: 500 });
    }


    const { error: ratingInsertErr } = await adminSupabase
      .from('ratings')
      .insert({
        order_id: orderId,
        consumer_id: user.id,
        peternak_id: order.peternak_id,
        rating_value: rating
      });

    if (ratingInsertErr) {
      await adminSupabase.from('orders').update({ rating: null }).eq('id', orderId);
      return NextResponse.json({ error: 'Gagal menyimpan data rating' }, { status: 500 });
    }

    try {
      await recalculatePeternakScore(order.peternak_id);
    } catch (e) {
      console.error('Failed to recalculate score on rating submit:', e);
    }

    const { error: ratingErr } = await adminSupabase.from('ratings').insert({
      order_id: orderId,
      consumer_id: order.consumer_id,
      peternak_id: order.peternak_id,
      rating_value: rating,
    });

    if (ratingErr) {
      return NextResponse.json({ error: 'Gagal menyimpan rating' }, { status: 500 });
    }

    try {
      await adminSupabase.rpc('recalculate_peternak_score', { p_peternak_id: order.peternak_id });
    } catch (scoreError) {
      console.error('Gagal menghitung ulang skor peternak', scoreError);
    }

    return NextResponse.json({ success: true, message: 'Rating berhasil disimpan' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
