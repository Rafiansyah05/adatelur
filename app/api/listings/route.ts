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

    const body = await request.json();
    const pricePerRak = Number(body.price_per_rak);
    const stockRak = Number(body.stock_rak);
    const isListingActive = body.is_listing_active ?? true;

    if (!Number.isFinite(pricePerRak) || pricePerRak < 0) {
      return NextResponse.json({ error: 'Harga per rak tidak valid' }, { status: 400 });
    }

    if (!Number.isFinite(stockRak) || stockRak < 0) {
      return NextResponse.json({ error: 'Stok rak tidak valid' }, { status: 400 });
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

    const today = new Date().toISOString().split('T')[0];

    const { data: existingListing, error: selectError } = await supabase
      .from('listings')
      .select('id')
      .eq('peternak_id', peternakDetail.id)
      .eq('listing_date', today)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    let listingQuery;

    if (existingListing?.id) {
      listingQuery = supabase
        .from('listings')
        .update({
          price_per_rak: pricePerRak,
          stock_rak: stockRak,
          is_listing_active: isListingActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingListing.id)
        .select('id, price_per_rak, stock_rak, is_listing_active, listing_date')
        .single();
    } else {
      listingQuery = supabase
        .from('listings')
        .insert({
          peternak_id: peternakDetail.id,
          price_per_rak: pricePerRak,
          stock_rak: stockRak,
          is_listing_active: isListingActive,
          listing_date: today,
        })
        .select('id, price_per_rak, stock_rak, is_listing_active, listing_date')
        .single();
    }

    const { data: listing, error: listingError } = await listingQuery;

    if (listingError) {
      return NextResponse.json({ error: listingError.message }, { status: 500 });
    }

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
