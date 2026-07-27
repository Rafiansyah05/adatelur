import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/fonnte';

function normalizePhone(phone: string) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sender = body.sender;
    const message = body.message?.toLowerCase().trim();

    if (!sender || !message) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const reply = async (text: string) => {
      await sendWhatsAppMessage(sender, text);
      return NextResponse.json({ message: text });
    };

    const supabase = createAdminClient();
    const parts = message.split(/\s+/);
    const action = parts[0];
    const now = new Date().toISOString();

    if (action === 'stok') {
      const amount = Number(parts[1]);
      if (!Number.isInteger(amount) || amount < 0) {
        return reply('Format salah. Balas: STOK <jumlah rak>, contoh: STOK 12');
      }

      const { data: peternakProfiles } = await supabase
        .from('profiles')
        .select('id, phone_number')
        .eq('role', 'peternak');

      const matchedProfile = (peternakProfiles ?? []).find(
        (profile) => normalizePhone(profile.phone_number) === normalizePhone(sender)
      );

      if (!matchedProfile) {
        return reply('Nomor Anda belum terdaftar sebagai peternak.');
      }

      const { data: peternakDetail } = await supabase
        .from('peternak_details')
        .select('id')
        .eq('profile_id', matchedProfile.id)
        .maybeSingle();

      if (!peternakDetail) {
        return reply('Data peternak tidak ditemukan.');
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update({ stock_rak: amount, updated_at: now })
        .eq('peternak_id', peternakDetail.id);

      if (updateError) {
        return reply('Gagal memperbarui stok. Coba lagi nanti.');
      }

      return reply(`Stok berhasil diperbarui menjadi *${amount} rak*.`);
    }

    if (!['terima', 'tolak'].includes(action) || !parts[1]) {
      return reply(
        'Format pesan tidak dikenali. Balas dengan:\nTERIMA <kode pesanan>\nTOLAK <kode pesanan>\nSTOK <jumlah rak>'
      );
    }

    const shortOrderId = parts[1];
    const newStatus = action === 'terima' ? 'accepted' : 'rejected';

    const { data: waitingOrders, error } = await supabase
      .from('orders')
      .select('id, order_status, peternak_id')
      .eq('order_status', 'waiting');

    if (error) {
      return reply('Terjadi kesalahan. Coba lagi nanti.');
    }

    const order = (waitingOrders ?? []).find((row) =>
      row.id.toLowerCase().startsWith(shortOrderId)
    );

    if (!order) {
      return reply('Pesanan tidak ditemukan atau sudah tidak berstatus menunggu.');
    }

    const { data: peternak } = await supabase
      .from('peternak_details')
      .select('profile_id')
      .eq('id', order.peternak_id)
      .single();

    if (!peternak?.profile_id) {
      return reply('Data peternak tidak ditemukan.');
    }

    const { data: peternakProfile } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', peternak.profile_id)
      .single();

    if (!peternakProfile || normalizePhone(peternakProfile.phone_number) !== normalizePhone(sender)) {
      return reply('Nomor pengirim tidak cocok dengan pemilik pesanan ini.');
    }

    await supabase
      .from('orders')
      .update({ order_status: newStatus, responded_at: now, updated_at: now })
      .eq('id', order.id);

    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: newStatus,
      note: `Peternak ${action} via WhatsApp`,
      created_at: now,
    });

    const successText =
      action === 'terima'
        ? `Pesanan *${shortOrderId}* berhasil diterima. Silakan siapkan pesanannya.`
        : `Pesanan *${shortOrderId}* telah ditolak.`;

    return reply(successText);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
