import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getBaseUrl(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const baseUrl = getBaseUrl(request);
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth`);
  }

  if (nextParam) {
    return NextResponse.redirect(`${baseUrl}${nextParam}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000).toString();
  const generatedPhone = `628${randomSuffix}`;
  const phoneToInsert = user.user_metadata?.phone_number || user.phone || generatedPhone;

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    role: 'consumer',
    full_name: user.user_metadata?.full_name || 'Pengguna Adatelur',
    email: user.email,
    phone_number: phoneToInsert,
  });

  if (insertError) {
    return NextResponse.redirect(`${baseUrl}/login?error=profile`);
  }

  return NextResponse.redirect(`${baseUrl}/`);
}
