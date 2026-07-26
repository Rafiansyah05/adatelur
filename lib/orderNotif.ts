import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/fonnte';

export async function sendOrderPaidNotif(orderId: string) {
  try {
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('notifications_log')
      .select('id')
      .eq('related_order_id', orderId)
      .eq('notif_type', 'order_paid')
      .maybeSingle();

    if (existing) {
      return;
    }

    const { data: order } = await supabase
      .from('orders')
      .select('id, peternak_id, consumer_id, rak_quantity, total_amount')
      .eq('id', orderId)
      .single();

    if (!order) {
      return;
    }

    const { data: peternakDetail } = await supabase
      .from('peternak_details')
      .select('profile_id')
      .eq('id', order.peternak_id)
      .single();

    if (!peternakDetail?.profile_id) {
      return;
    }

    const { data: peternakProfile } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', peternakDetail.profile_id)
      .single();

    if (!peternakProfile?.phone_number) {
      return;
    }

    const { data: consumerProfile } = await supabase
      .from('profiles')
      .select('full_name, phone_number')
      .eq('id', order.consumer_id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const message =
      `Pembayaran berhasil!\n\n` +
      `Pesanan dari ${consumerProfile?.full_name || 'Konsumen'} sudah dibayar.\n` +
      `No. WA: ${consumerProfile?.phone_number || '-'}\n` +
      `Jumlah: ${order.rak_quantity} rak\n` +
      `Total: Rp${Number(order.total_amount).toLocaleString('id-ID')}\n\n` +
      `Lihat detail pesanan:\n` +
      `${appUrl}/dashboard/orders/${order.id}`;

    await sendWhatsAppMessage(peternakProfile.phone_number, message);

    await supabase.from('notifications_log').insert({
      recipient_id: peternakDetail.profile_id,
      channel: 'whatsapp',
      notif_type: 'order_paid',
      related_order_id: order.id,
      payload: { total_amount: order.total_amount },
    });
  } catch (error) {
    console.error('Gagal kirim notifikasi pembayaran', error);
  }
}
