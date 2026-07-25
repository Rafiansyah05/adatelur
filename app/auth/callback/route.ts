import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    return NextResponse.redirect(`${origin}/`);
  }

    // Menghasilkan nomor acak 11 digit yang berawalan 628 untuk bypass unik & format
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
    const generatedPhone = `628${randomSuffix}`;
    
    // Gunakan phone_number dari user_metadata jika ada (dari pendaftaran manual)
    const phoneToInsert = user.user_metadata?.phone_number || user.phone || generatedPhone;

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      role: 'consumer',
      full_name: user.user_metadata?.full_name || 'Pengguna Adatelur',
      email: user.email,
      phone_number: phoneToInsert,
    });

  if (insertError) {
    return NextResponse.redirect(`${origin}/login?error=profile`);
  }

  return NextResponse.redirect(`${origin}/`);
}
