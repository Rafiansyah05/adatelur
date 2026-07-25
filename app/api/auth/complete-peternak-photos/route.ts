import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { peternakId, photos } = body; // photos = { type: string, src: string }[]

    if (!peternakId || !photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    for (const p of photos) {
      if (!p.src) continue;

      try {
        // Convert base64 to buffer
        const base64Data = p.src.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const filePath = `${peternakId}/${p.type}_${Date.now()}.jpg`;

        // Upload using admin client to bypass RLS
        const { error: uploadError } = await adminClient.storage
          .from('verification-photos')
          .upload(filePath, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.warn(`Gagal upload foto ke storage ${p.type}:`, uploadError.message);
          continue;
        }

        const { data: publicUrlData } = adminClient.storage
          .from('verification-photos')
          .getPublicUrl(filePath);

        // Insert into DB
        const { error: insertError } = await adminClient
          .from('peternak_verification_photos')
          .insert({
            peternak_id: peternakId,
            photo_type: p.type,
            photo_url: publicUrlData.publicUrl,
          });

        if (insertError) {
          console.warn(`Gagal insert foto ke DB ${p.type}:`, insertError.message);
        }
      } catch (innerErr) {
        console.warn(`Exception saat memproses foto ${p.type}:`, innerErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
