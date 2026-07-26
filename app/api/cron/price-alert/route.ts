import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/fonnte';
import { getWeeklyTelurChange } from '@/lib/pihps';

const thresholdPct = 10;

export async function GET(request: Request) {
  try {
    if (
      process.env.NODE_ENV === 'production' &&
      request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const change = await getWeeklyTelurChange();
    if (!change) {
      return NextResponse.json({ success: true, sent: 0, reason: 'no price data' });
    }

    if (Math.abs(change.changePct) < thresholdPct) {
      return NextResponse.json({
        success: true,
        sent: 0,
        changePct: Number(change.changePct.toFixed(2)),
      });
    }

    const supabase = createAdminClient();

    const { data: peternaks, error: peternakError } = await supabase
      .from('peternak_details')
      .select('id, profile_id')
      .eq('verification_status', 'approved')
      .eq('is_active', true);

    if (peternakError) {
      return NextResponse.json({ error: peternakError.message }, { status: 500 });
    }

    if (!peternaks || peternaks.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const profileIds = peternaks.map((peternak) => peternak.profile_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, phone_number')
      .in('id', profileIds);

    const phoneMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.phone_number]));

    const { data: sentLog } = await supabase
      .from('notifications_log')
      .select('recipient_id')
      .eq('notif_type', 'price_alert')
      .contains('payload', { date: change.latest.date });

    const alreadySent = new Set((sentLog ?? []).map((log) => log.recipient_id));

    const naik = change.changePct >= 0;
    const arah = naik ? 'naik' : 'turun';
    const persen = Math.abs(change.changePct).toFixed(1);

    const message =
      `*Info Harga Telur (PIHPS Nasional)*\n\n` +
      `Harga telur ayam ras *${arah} ${persen}%* dalam seminggu terakhir.\n\n` +
      `*Minggu lalu:* Rp${change.previous.price.toLocaleString('id-ID')}/kg\n` +
      `*Sekarang:* Rp${change.latest.price.toLocaleString('id-ID')}/kg\n\n` +
      `Bisa jadi pertimbangan untuk menyesuaikan harga jualmu.`;

    let sent = 0;

    for (const peternak of peternaks) {
      if (alreadySent.has(peternak.profile_id)) continue;

      const phone = phoneMap.get(peternak.profile_id);
      if (!phone) continue;

      await sendWhatsAppMessage(phone, message);

      await supabase.from('notifications_log').insert({
        recipient_id: peternak.profile_id,
        channel: 'whatsapp',
        notif_type: 'price_alert',
        payload: {
          date: change.latest.date,
          change_pct: Number(change.changePct.toFixed(2)),
          latest: change.latest.price,
          previous: change.previous.price,
        },
      });

      sent += 1;
    }

    return NextResponse.json({
      success: true,
      sent,
      changePct: Number(change.changePct.toFixed(2)),
      latest: change.latest,
      previous: change.previous,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
