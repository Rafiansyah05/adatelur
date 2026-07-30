import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const adminClient = createAdminClient();
    const peternakId = params.id;

    if (!peternakId) {
      return NextResponse.json({ error: 'Missing peternak ID' }, { status: 400 });
    }

    let profile: any = null;
    const { data: profileData } = await adminClient
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        peternak_details (
          id,
          farm_address,
          farm_latitude,
          farm_longitude,
          has_vehicle,
          listings (
            id,
            price_per_rak,
            stock_rak,
            is_listing_active,
            updated_at
          ),
          peternak_scores (
            final_score
          )
        )
      `)
      .eq('id', peternakId)
      .maybeSingle();

    profile = profileData;

    if (!profile) {
      // Maybe the id is peternak_details id?
      const { data: pdFallback } = await adminClient
        .from('peternak_details')
        .select('profile_id')
        .eq('id', peternakId)
        .maybeSingle();

      if (pdFallback) {
        const { data: profile2 } = await adminClient
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            peternak_details (
              id,
              farm_address,
              farm_latitude,
              farm_longitude,
              has_vehicle,
              listings (
                id,
                price_per_rak,
                stock_rak,
                is_listing_active,
                updated_at
              ),
              peternak_scores (
                final_score
              )
            )
          `)
          .eq('id', pdFallback.profile_id)
          .maybeSingle();

        profile = profile2;
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
    }

    const p = profile;
    const pd = Array.isArray(p?.peternak_details) ? p.peternak_details[0] : p?.peternak_details;
    const listing = Array.isArray(pd?.listings) ? pd.listings[0] : pd?.listings;
    const score = Array.isArray(pd?.peternak_scores) ? pd.peternak_scores[0] : pd?.peternak_scores;

    const actualPeternakId = pd?.id || peternakId;

    const { data: deliverySlots, error: slotsError } = await adminClient
      .from('delivery_slots')
      .select('*')
      .eq('peternak_id', actualPeternakId)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 });
    }

    // Cutoff time: Max between start of today (00:00:00) and the last listing stock update (listing.updated_at)
    // Orders created before this cutoff MUST NOT reduce the new batch of stock.
    const startOfTodayMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const listingUpdatedMs = listing?.updated_at ? new Date(listing.updated_at).getTime() : 0;
    const cutoffTime = new Date(Math.max(startOfTodayMs, listingUpdatedMs)).toISOString();

    const { data: ordersAfterCutoff, error: ordersError } = await adminClient
      .from('orders')
      .select('rak_quantity')
      .eq('peternak_id', actualPeternakId)
      .eq('payment_status', 'paid')
      .gte('created_at', cutoffTime);

    if (ordersError) console.error("Error fetching ordersAfterCutoff:", ordersError);

    const soldRakToday = (ordersAfterCutoff || []).reduce((sum, order) => sum + (order.rak_quantity || 0), 0);

    const responseData = {
      id: actualPeternakId,
      full_name: p?.full_name,
      avatar_url: p?.avatar_url,
      farm_address: pd?.farm_address || 'Alamat tidak tersedia',
      rating: 4.8,
      score: score?.final_score || 0,
      price_per_rak: listing?.price_per_rak || 50000,
      stock_rak: listing?.stock_rak || 0,
      sold_rak_today: soldRakToday,
      farm_latitude: pd?.farm_latitude || 0,
      farm_longitude: pd?.farm_longitude || 0,
      listing_id: listing?.id || `dummy-${p?.id}`,
      delivery_slots: deliverySlots || [],
      has_vehicle: pd?.has_vehicle ?? false,
    };

    return NextResponse.json({ data: responseData });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
