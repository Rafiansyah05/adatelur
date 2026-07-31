import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: addr, error } = await supabase
      .from('consumer_addresses')
      .select('*')
      .eq('profile_id', user.id)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, address: addr, data: addr });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const fullAddress = body.full_address || body.fullAddress;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!fullAddress || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Data alamat tidak valid (butuh full_address, latitude, longitude)' }, { status: 400 });
    }

    await supabase
      .from('consumer_addresses')
      .update({ is_default: false })
      .eq('profile_id', user.id);

    const { data: newAddr, error: insertError } = await supabase
      .from('consumer_addresses')
      .insert({
        profile_id: user.id,
        full_address: fullAddress,
        latitude,
        longitude,
        is_default: true
      })
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: newAddr, data: newAddr });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
