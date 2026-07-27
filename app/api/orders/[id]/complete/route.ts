import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { photo_base64 } = await request.json();

    if (!photo_base64) {
      return NextResponse.json({ error: 'Foto bukti pengiriman wajib dilampirkan' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const orderId = params.id;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.order_status !== 'accepted' && order.order_status !== 'in_delivery') {
      return NextResponse.json({ error: 'Status pesanan tidak valid untuk diselesaikan' }, { status: 400 });
    }

    const base64Data = photo_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `proof_${orderId}_${Date.now()}.jpg`;

    const { error: uploadError } = await supabase
      .storage
      .from('delivery-proofs')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    let photoUrl = '';
    if (uploadError) {
      console.error('Upload Error:', uploadError);
      photoUrl = `placeholder_error_${fileName}`;
    } else {
      const { data: publicUrlData } = supabase.storage.from('delivery-proofs').getPublicUrl(fileName);
      photoUrl = publicUrlData.publicUrl;
    }

    await supabase.from('delivery_proof').insert({
      order_id: orderId,
      photo_url: photoUrl
    });

    const { error: updateError } = await supabase
      .from('orders')
      .update({ order_status: 'completed' })
      .eq('id', orderId);

    if (updateError) throw updateError;

    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'completed',
      note: 'Pesanan telah diselesaikan dan bukti telah diunggah.'
    });

    try {
      await supabase.rpc('credit_wallet_from_order', { p_order_id: orderId });
    } catch (e) {
      console.error('Gagal menambahkan saldo peternak', e);
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/peternak/${order.peternak_id}/recalculate-score`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to trigger score recalculation', e);
    }

    return NextResponse.json({ success: true, message: 'Pesanan berhasil diselesaikan' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
