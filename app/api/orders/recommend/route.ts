import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rak_quantity, fulfillment_method, consumer_lat, consumer_lng } = body;

    if (!rak_quantity || rak_quantity < 1 || !fulfillment_method) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (fulfillment_method === 'delivery' && (consumer_lat === undefined || consumer_lng === undefined)) {
      return NextResponse.json({ error: 'Missing coordinates for delivery' }, { status: 400 });
    }

    const { data: listings, error: fetchError } = await supabase
      .from('public_listings')
      .select('*');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!listings) {
      return NextResponse.json({ data: [] });
    }

    const processedListings = listings.map((listing) => {
      const {
        listing_id,
        peternak_id,
        peternak_name,
        avatar_url,
        price_per_rak,
        farm_latitude,
        farm_longitude,
        final_score,
      } = listing;

      const price = Number(price_per_rak);
      const subtotal = price * Number(rak_quantity);

      if (fulfillment_method === 'pickup') {
        return {
          listing_id,
          peternak_id,
          peternak_name,
          avatar_url,
          price_per_rak: price,
          final_score,
          distance_km: 0,
          ongkir_amount: 0,
          total_cost: subtotal,
        };
      }

      const distanceKm = haversineDistance(
        Number(consumer_lat),
        Number(consumer_lng),
        Number(farm_latitude),
        Number(farm_longitude)
      );

      const ongkirAmount = calculateOngkir(distanceKm);
      const totalCost = subtotal + ongkirAmount;

      return {
        listing_id,
        peternak_id,
        peternak_name,
        avatar_url,
        price_per_rak: price,
        final_score,
        distance_km: distanceKm,
        ongkir_amount: ongkirAmount,
        total_cost: totalCost,
      };
    });

    processedListings.sort((a, b) => a.total_cost - b.total_cost);

    return NextResponse.json({ data: processedListings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
