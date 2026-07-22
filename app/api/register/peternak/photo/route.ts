import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { peternakId, photoType, photoUrl } = await req.json();

    if (!peternakId || !photoType || !photoUrl) {
      return NextResponse.json({ error: 'Data foto tidak lengkap.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('peternak_verification_photos').insert({
      peternak_id: peternakId,
      photo_type: photoType,
      photo_url: photoUrl,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
