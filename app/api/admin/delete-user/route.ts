import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const userId = body?.user_id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    await Promise.all([
      admin.from('peternak_details').delete().eq('profile_id', userId),
      admin.from('listings').delete().eq('peternak_id', userId),
      admin.from('delivery_slots').delete().eq('peternak_id', userId),
      admin.from('profiles').delete().eq('id', userId),
    ]);
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
