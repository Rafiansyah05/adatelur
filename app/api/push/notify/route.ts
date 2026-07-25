import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webPush.setVapidDetails(
    'mailto:support@adatelur.com',
    vapidPublic,
    vapidPrivate
  );
}

import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabaseClient = createClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { peternak_id, title, body, url } = await req.json();

    if (!peternak_id) {
      return NextResponse.json({ error: 'Missing peternak_id' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Peternak profile_id is the user_id for push_subscriptions
    const { data: peternak } = await supabase
      .from('peternak_details')
      .select('profile_id')
      .eq('id', peternak_id)
      .single();

    if (!peternak) {
      return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', peternak.profile_id);

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title: title || 'Notifikasi Adatelur',
      body: body || 'Anda memiliki pesan baru',
      url: url || '/dashboard/orders',
      vibrate: [200, 100, 200, 100, 200, 100, 200], // long vibrate for attention
      sound: 'default' // hints the browser to use default notification sound
    });

    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not configured. Skipping push notification:', payload);
      return NextResponse.json({ success: true, count: 0, message: 'Skipped due to missing VAPID keys' });
    }

    const sendPromises = subscriptions.map((sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      return webPush.sendNotification(pushSubscription, payload).catch((err: any) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Clean up expired subscriptions
          return supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Error sending push:', err);
        }
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, count: subscriptions.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
