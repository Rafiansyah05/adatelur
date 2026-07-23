import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: peternakDetail, error: peternakError } = await supabase
      .from('peternak_details')
      .select('id, verification_status')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (peternakError) {
      return NextResponse.json({ error: peternakError.message }, { status: 500 });
    }

    if (!peternakDetail || peternakDetail.verification_status !== 'approved') {
      return NextResponse.json({ error: 'Akun peternak belum disetujui' }, { status: 403 });
    }

    const body = await request.json();
    const pricePerRak = Number(
      body.price_per_rak !== undefined ? body.price_per_rak : body.pricePerRak
    );
    const stockRak = Number(body.stock_rak !== undefined ? body.stock_rak : body.stockRak);
    const isListingActive = body.is_listing_active ?? body.isListingActive ?? true;

    if (!Number.isFinite(pricePerRak) || pricePerRak <= 0) {
      return NextResponse.json({ error: 'Harga per rak tidak valid' }, { status: 400 });
    }

    if (!Number.isFinite(stockRak) || stockRak < 0) {
      return NextResponse.json({ error: 'Stok rak tidak valid' }, { status: 400 });
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    const { data: existingListing, error: selectError } = await supabase
      .from('listings')
      .select('id')
      .eq('peternak_id', peternakDetail.id)
      .eq('listing_date', todayDateStr)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    let result;
    if (existingListing?.id) {
      const { data, error: updateError } = await supabase
        .from('listings')
        .update({
          price_per_rak: pricePerRak,
          stock_rak: stockRak,
          is_listing_active: isListingActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingListing.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      result = data;
    } else {
      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          peternak_id: peternakDetail.id,
          price_per_rak: pricePerRak,
          stock_rak: stockRak,
          is_listing_active: isListingActive,
          listing_date: todayDateStr,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, listing: result, data: result });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
