import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    
    const body = await request.json();
    const { rak_quantity, fulfillment_method, consumer_lat, consumer_lng, sort_by = 'efficiency', ignore_stock = false } = body;

    if (!rak_quantity || rak_quantity < 1 || !fulfillment_method) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (fulfillment_method === 'delivery' && (consumer_lat === undefined || consumer_lng === undefined)) {
      return NextResponse.json({ error: 'Missing coordinates for delivery' }, { status: 400 });
    }

    // Fetch from peternak_details to properly join profiles, listings, and peternak_scores
    const { data: rawPeternaks, error: fetchError } = await supabase
      .from('peternak_details')
      .select(`
        id,
        farm_latitude,
        farm_longitude,
        farm_address,
        has_vehicle,
        verification_status,
        profiles!inner (
          id,
          full_name,
          avatar_url
        ),
        listings (
          id,
          price_per_rak,
          stock_rak,
          is_listing_active,
          updated_at
        ),
        peternak_scores (
          final_score,
          is_suspended,
          average_rating
        )
      `)
      .eq('verification_status', 'approved');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!rawPeternaks || rawPeternaks.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const peternakIds = rawPeternaks.map((p) => p.id);
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('peternak_id')
      .in('peternak_id', peternakIds)
      .eq('order_status', 'completed');

    const completedOrdersCount = peternakIds.reduce((acc: any, id) => {
      acc[id] = completedOrders?.filter((o: any) => o.peternak_id === id).length || 0;
      return acc;
    }, {});

    // Fetch today's accepted/in-progress/completed order quantities to calculate remaining stock
    const startOfToday = new Date(new Date().setHours(0,0,0,0)).toISOString();
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('peternak_id, rak_quantity, created_at')
      .in('peternak_id', peternakIds)
      .eq('payment_status', 'paid')
      .gte('created_at', startOfToday);

    // Format raw data and apply stock filtering
    const listings = rawPeternaks.map((pd: any) => {
      const p = pd.profiles;
      const listing = Array.isArray(pd.listings) ? pd.listings[0] : pd.listings;
      const score = Array.isArray(pd.peternak_scores) ? pd.peternak_scores[0] : pd.peternak_scores;
      
      const startOfTodayMs = new Date(startOfToday).getTime();
      const listingUpdatedMs = listing?.updated_at ? new Date(listing.updated_at).getTime() : 0;
      const cutoffTime = new Date(Math.max(startOfTodayMs, listingUpdatedMs)).toISOString();

      const todaySold = (todayOrders ?? [])
        .filter((o: any) => o.peternak_id === pd.id && o.created_at >= cutoffTime)
        .reduce((sum: number, o: any) => sum + Number(o.rak_quantity), 0);

      const initialStock = listing?.stock_rak || 0;
      const remainingStock = Math.max(0, initialStock - todaySold);
      
      return {
        listing_id: listing?.id || `dummy-${pd.id}`,
        peternak_id: pd.id,
        peternak_name: p.full_name,
        avatar_url: p.avatar_url,
        price_per_rak: listing?.price_per_rak || 50000, 
        stock_rak: remainingStock, // Use actual remaining stock
        is_available: listing?.is_listing_active ?? false,
        farm_address: pd.farm_address || 'Alamat belum diatur',
        farm_latitude: pd.farm_latitude || 0,
        farm_longitude: pd.farm_longitude || 0,
        final_score: score?.final_score || 0,
        is_suspended: score?.is_suspended || false,
        average_rating: score?.average_rating || 0,
        total_completed_orders: completedOrdersCount[pd.id] || 0,
        has_vehicle: pd.has_vehicle ?? false,
      };
    }).filter((l: any) => {
      if (l.is_available === false) return false;
      if (fulfillment_method === 'delivery' && !l.has_vehicle) return false;
      if (!ignore_stock && l.stock_rak < rak_quantity) return false;
      return true;
    });

    const processedListings = listings.map((listing) => {
      const {
        listing_id,
        peternak_id,
        peternak_name,
        avatar_url,
        price_per_rak,
        farm_address,
        farm_latitude,
        farm_longitude,
        final_score,
        average_rating,
        total_completed_orders,
      } = listing;

      let distanceKm = 0;
      if (consumer_lat !== undefined && consumer_lng !== undefined) {
        distanceKm = haversineDistance(
          Number(consumer_lat),
          Number(consumer_lng),
          Number(farm_latitude),
          Number(farm_longitude)
        );
      }

      const price = Number(price_per_rak);
      const subtotal = price * Number(rak_quantity);

      if (fulfillment_method === 'pickup') {
        return {
          listing_id,
          peternak_id,
          peternak_name,
          avatar_url,
          farm_address,
          price_per_rak: price,
          final_score,
          average_rating,
          total_completed_orders,
          distance_km: distanceKm,
          ongkir_amount: 0,
          total_cost: subtotal,
        };
      }

      const ongkirAmount = calculateOngkir(distanceKm);
      const totalCost = subtotal + ongkirAmount;

      return {
        listing_id,
        peternak_id,
        peternak_name,
        avatar_url,
        farm_address,
        price_per_rak: price,
        final_score,
        average_rating,
        total_completed_orders,
        distance_km: distanceKm,
        ongkir_amount: ongkirAmount,
        total_cost: totalCost,
      };
    });

    if (sort_by === 'score') {
      processedListings.sort((a, b) => b.final_score - a.final_score);
    } else if (sort_by === 'distance') {
      processedListings.sort((a, b) => {
        if (a.distance_km === b.distance_km) {
          return a.price_per_rak - b.price_per_rak;
        }
        return a.distance_km - b.distance_km;
      });
    } else {
      processedListings.sort((a, b) => a.total_cost - b.total_cost);
    }

    return NextResponse.json({ data: processedListings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
