import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone_number } = body;

    if (!full_name || !phone_number) {
      return NextResponse.json({ error: 'Nama dan nomor telepon harus diisi' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name,
        phone_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      if (updateError.code === '23505' && updateError.message.includes('phone_number')) {
        return NextResponse.json({ error: 'Nomor telepon ini sudah digunakan oleh akun lain.' }, { status: 409 });
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
