import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { rating_value, review_text } = await request.json();

    if (!rating_value || rating_value < 1 || rating_value > 5) {
      return NextResponse.json({ error: 'Nilai rating tidak valid' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('consumer_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.order_status !== 'completed') {
      return NextResponse.json({ error: 'Pesanan belum selesai' }, { status: 400 });
    }

    const { error: ratingError } = await supabase.from('ratings').insert({
      order_id: orderId,
      consumer_id: user.id,
      peternak_id: order.peternak_id,
      rating_value: rating_value,
      review_text: review_text
    });

    if (ratingError) {
      return NextResponse.json({ error: 'Gagal menyimpan ulasan. Mungkin Anda sudah memberikan ulasan.' }, { status: 400 });
    }

    try {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/peternak/${order.peternak_id}/recalculate-score`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to trigger score recalculation', e);
    }

    return NextResponse.json({ success: true, message: 'Ulasan berhasil disimpan' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
