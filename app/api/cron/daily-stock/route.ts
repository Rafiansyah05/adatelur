import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/fonnte';

const RAK_SIZE = 30;

export async function GET(request: Request) {
  try {
    if (
      process.env.NODE_ENV === 'production' &&
      request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const device = process.env.FONNTE_DEVICE_NUMBER;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    ).toISOString();

    const { data: peternaks, error: peternakError } = await supabase
      .from('peternak_details')
      .select('id, profile_id, daily_clean_eggs, daily_egg_production, daily_damaged_eggs')
      .eq('verification_status', 'approved')
      .eq('is_active', true);

    if (peternakError) {
      return NextResponse.json({ error: peternakError.message }, { status: 500 });
    }

    if (!peternaks || peternaks.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const peternakIds = peternaks.map((p) => p.id);
    const profileIds = peternaks.map((p) => p.profile_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, phone_number')
      .in('id', profileIds);

    const phoneMap = new Map((profiles ?? []).map((p) => [p.id, p.phone_number]));

    const { data: listings } = await supabase
      .from('listings')
      .select('peternak_id, stock_rak')
      .in('peternak_id', peternakIds);

    const stockMap = new Map((listings ?? []).map((l) => [l.peternak_id, l.stock_rak]));

    const { data: completedHistory } = await supabase
      .from('order_status_history')
      .select('order_id')
      .eq('status', 'completed')
      .gte('created_at', yesterdayStart)
      .lt('created_at', todayStart);

    const soldMap = new Map<string, number>();
    const completedIds = (completedHistory ?? []).map((h) => h.order_id);
    if (completedIds.length > 0) {
      const { data: soldOrders } = await supabase
        .from('orders')
        .select('peternak_id, rak_quantity')
        .in('id', completedIds);

      for (const soldOrder of soldOrders ?? []) {
        soldMap.set(
          soldOrder.peternak_id,
          (soldMap.get(soldOrder.peternak_id) ?? 0) + soldOrder.rak_quantity
        );
      }
    }

    const { data: sentToday } = await supabase
      .from('notifications_log')
      .select('recipient_id')
      .eq('notif_type', 'daily_stock')
      .gte('sent_at', todayStart);

    const alreadySent = new Set((sentToday ?? []).map((n) => n.recipient_id));

    let sent = 0;

    for (const peternak of peternaks) {
      if (alreadySent.has(peternak.profile_id)) {
        continue;
      }

      const phone = phoneMap.get(peternak.profile_id);
      if (!phone) {
        continue;
      }

      const stockYesterday = stockMap.get(peternak.id) ?? 0;
      const soldYesterday = soldMap.get(peternak.id) ?? 0;
      const leftover = Math.max(0, stockYesterday - soldYesterday);

      const baselineEggs =
        peternak.daily_clean_eggs && peternak.daily_clean_eggs > 0
          ? peternak.daily_clean_eggs
          : Math.max(0, (peternak.daily_egg_production ?? 0) - (peternak.daily_damaged_eggs ?? 0));

      const baselineRak = Math.floor(baselineEggs / RAK_SIZE);
      const projectedStock = baselineRak + leftover;

      const confirmLine = device
        ? `Jika stok hari ini sama seperti biasa, stok jadi *${projectedStock} rak*.\n\nSetuju? Tap:\nhttps://wa.me/${device}?text=${encodeURIComponent(`STOK ${projectedStock}`)}`
        : `Jika sama seperti biasa, balas: STOK ${projectedStock}`;

      const message =
        `*Selamat pagi! Rekap kemarin:*\n\n` +
        `*Terjual:* ${soldYesterday} rak\n` +
        `*Stok kemarin:* ${stockYesterday} rak\n` +
        `*Sisa:* ${leftover} rak\n\n` +
        `${confirmLine}\n\n` +
        `Ubah stok manual:\n${appUrl}/dashboard/availability`;

      await sendWhatsAppMessage(phone, message);

      await supabase.from('notifications_log').insert({
        recipient_id: peternak.profile_id,
        channel: 'whatsapp',
        notif_type: 'daily_stock',
        payload: {
          sold: soldYesterday,
          stock_yesterday: stockYesterday,
          leftover,
          projected: projectedStock,
        },
      });

      sent += 1;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
