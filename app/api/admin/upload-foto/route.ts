import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const peternakId = formData.get('peternakId') as string;
    const type = formData.get('type') as string;
    if (!file || !peternakId || !type) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const ext = file.name.split('.').pop();
    const fileName = `${peternakId}_${type}_${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('verification-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = adminClient.storage
      .from('verification-photos')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    const { error: dbError } = await adminClient
      .from('peternak_verification_photos')
      .insert({
        peternak_id: peternakId,
        photo_type: type,
        photo_url: publicUrl,
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Upload foto error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
