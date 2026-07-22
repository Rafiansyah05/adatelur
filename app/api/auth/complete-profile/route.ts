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
    const { role, full_name, phone_number } = body;

    if (!role || !full_name || !phone_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        role,
        full_name,
        phone_number,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
