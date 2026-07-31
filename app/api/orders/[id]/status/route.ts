import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status wajib diisi' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const orderId = params.id;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId);

    if (updateError) throw updateError;

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: status,
      note: status === 'in_delivery' ? 'Pesanan sedang diantar oleh peternak' : 'Status diperbarui'
    });

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
