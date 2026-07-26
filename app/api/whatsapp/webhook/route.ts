import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function normalizePhone(phone: string) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sender = body.sender;
    const message = body.message?.toLowerCase().trim();

    if (!sender || !message) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const parts = message.split(' ');
    const actionStr = parts[0];
    const shortOrderId = parts[1];

    if (!['terima', 'tolak'].includes(actionStr) || !shortOrderId) {
      return NextResponse.json({
        message: 'Format pesan tidak dikenali. Balas dengan: TERIMA <ID_ORDER> atau TOLAK <ID_ORDER>',
      });
    }

    const newStatus = actionStr === 'terima' ? 'accepted' : 'rejected';
    const supabase = createAdminClient();

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_status, peternak_id')
      .eq('order_status', 'waiting')
      .ilike('id', `${shortOrderId}%`);

    if (error || !orders || orders.length === 0) {
      return NextResponse.json({ message: 'Order tidak ditemukan atau sudah tidak berstatus menunggu.' });
    }

    const order = orders[0];

    const { data: peternak } = await supabase
      .from('peternak_details')
      .select('profile_id')
      .eq('id', order.peternak_id)
      .single();

    if (!peternak?.profile_id) {
      return NextResponse.json({ message: 'Data peternak tidak ditemukan.' });
    }

    const { data: peternakProfile } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', peternak.profile_id)
      .single();

    if (!peternakProfile || normalizePhone(peternakProfile.phone_number) !== normalizePhone(sender)) {
      return NextResponse.json({ message: 'Nomor pengirim tidak cocok dengan pemilik pesanan ini.' });
    }

    const now = new Date().toISOString();
    await supabase
      .from('orders')
      .update({ order_status: newStatus, responded_at: now, updated_at: now })
      .eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: newStatus,
      note: `Peternak ${actionStr} via WhatsApp`,
      created_at: now,
    });

    return NextResponse.json({ message: `Pesanan ${shortOrderId} berhasil di-${actionStr}.` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
