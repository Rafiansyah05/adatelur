import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: peternakDetails, error: detailsError } = await supabase
      .from('peternak_details')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (detailsError || !peternakDetails) {
      return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
    }

    const body = await request.json();
    const { price_per_rak, stock_rak, is_listing_active } = body;

    if (price_per_rak === undefined || stock_rak === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    const { data: existingListing } = await supabase
      .from('listings')
      .select('id')
      .eq('peternak_id', peternakDetails.id)
      .eq('listing_date', todayDateStr)
      .single();

    let result;
    if (existingListing) {
      const { data, error } = await supabase
        .from('listings')
        .update({
          price_per_rak,
          stock_rak,
          is_listing_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingListing.id)
        .select()
        .single();
        
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('listings')
        .insert({
          peternak_id: peternakDetails.id,
          price_per_rak,
          stock_rak,
          is_listing_active: is_listing_active !== undefined ? is_listing_active : true,
          listing_date: todayDateStr
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
