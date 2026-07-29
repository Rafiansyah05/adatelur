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

    const { data: profile, error: peternakError } = await adminClient
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        peternak_details (
          id,
          farm_latitude,
          farm_longitude,
          listings (
            id,
            price_per_rak,
            stock_rak,
            is_listing_active
          ),
          peternak_scores (
            final_score
          )
        )
      `)
      .eq('id', peternakId)
      .maybeSingle();

    if (peternakError || !profile) {
      // Maybe the id is peternak_details id?
      const { data: pdFallback } = await adminClient
        .from('peternak_details')
        .select('profile_id')
        .eq('id', peternakId)
        .maybeSingle();
        
      if (!pdFallback) {
         return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
      }
      
      const { data: profile2 } = await adminClient
        .from('profiles')
        .select(`id, full_name, avatar_url, peternak_details(id, farm_latitude, farm_longitude, listings(id, price_per_rak, stock_rak, is_available), peternak_scores(final_score))`)
        .eq('id', pdFallback.profile_id)
        .maybeSingle();
        
      if (!profile2) return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
      Object.assign(profile || {}, profile2);
    }
    
    const p = profile as any;
    const pd = Array.isArray(p?.peternak_details) ? p.peternak_details[0] : p?.peternak_details;
    const listing = Array.isArray(pd?.listings) ? pd.listings[0] : pd?.listings;
    const score = Array.isArray(pd?.peternak_scores) ? pd.peternak_scores[0] : pd?.peternak_scores;

    const actualPeternakId = pd?.id || peternakId;
    
    const peternak = {
      id: actualPeternakId,
      farm_address: 'Lokasi peternak (Detail alamat tersedia setelah pesanan diterima)',
      farm_latitude: pd?.farm_latitude || 0,
      farm_longitude: pd?.farm_longitude || 0,
      profiles: {
        full_name: p?.full_name,
        avatar_url: p?.avatar_url,
      },
      peternak_scores: {
        final_score: score?.final_score || 0,
        average_rating: 4.8,
      },
      listing_id: listing?.id || `dummy-${p?.id}`,
      price_per_rak: listing?.price_per_rak || 50000,
      is_available: listing?.is_listing_active ?? true,
    };

    const todayDateStr = new Date().toISOString().split('T')[0];

    const { data: deliverySlots, error: slotsError } = await adminClient
      .from('delivery_slots')
      .select('*')
      .eq('peternak_id', actualPeternakId)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: ordersToday, error: ordersError } = await adminClient
      .from('orders')
      .select('rak_quantity')
      .eq('peternak_id', actualPeternakId)
      .gte('created_at', todayStart.toISOString())
      .in('order_status', ['waiting', 'accepted', 'in_delivery', 'completed']);
      
    if (ordersError) console.error("Error fetching ordersToday:", ordersError);

    const soldRakToday = (ordersToday || []).reduce((sum, order) => sum + (order.rak_quantity || 0), 0);

    const responseData = {
      id: actualPeternakId,
      full_name: p?.full_name,
      rating: 4.8,
      score: score?.final_score || 0,
      price_per_rak: peternak.price_per_rak,
      stock_rak: listing?.stock_rak || 0,
      sold_rak_today: soldRakToday,
      farm_latitude: peternak.farm_latitude,
      farm_longitude: peternak.farm_longitude,
      listing_id: peternak.listing_id,
      delivery_slots: deliverySlots || [],
    };

    return NextResponse.json({ data: responseData });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
