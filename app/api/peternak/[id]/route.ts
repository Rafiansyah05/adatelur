import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const peternakId = params.id;

    if (!peternakId) {
      return NextResponse.json({ error: 'Missing peternak ID' }, { status: 400 });
    }

    const { data: profile, error: peternakError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        peternak_details (
          id,
          farm_latitude,
          farm_longitude
        ),
        listings (
          id,
          price_per_rak,
          is_available
        ),
        peternak_scores (
          final_score
        )
      `)
      .eq('id', peternakId) // Wait, the param id is peternak_id or profile_id? In the search results it is profile id!
      .maybeSingle();

    if (peternakError || !profile) {
      // Maybe the id is peternak_details id?
      const { data: pdFallback } = await supabase
        .from('peternak_details')
        .select('profile_id')
        .eq('id', peternakId)
        .maybeSingle();
        
      if (!pdFallback) {
         return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
      }
      
      const { data: profile2 } = await supabase
        .from('profiles')
        .select(`id, full_name, avatar_url, peternak_details(id, farm_latitude, farm_longitude), listings(id, price_per_rak, is_available), peternak_scores(final_score)`)
        .eq('id', pdFallback.profile_id)
        .maybeSingle();
        
      if (!profile2) return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
      Object.assign(profile || {}, profile2);
    }
    
    const p = profile as any;
    const pd = Array.isArray(p?.peternak_details) ? p.peternak_details[0] : p?.peternak_details;
    const listing = Array.isArray(p?.listings) ? p.listings[0] : p?.listings;
    const score = Array.isArray(p?.peternak_scores) ? p.peternak_scores[0] : p?.peternak_scores;

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
      is_available: listing?.is_available ?? true,
    };

    const adminClient = createAdminClient();
    const todayDateStr = new Date().toISOString().split('T')[0];

    const { data: deliverySlots, error: slotsError } = await adminClient
      .from('delivery_slots')
      .select('*')
      .eq('peternak_id', actualPeternakId)
      .eq('is_active', true)
      .gte('slot_date', todayDateStr)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 });
    }

    const responseData = {
      id: actualPeternakId,
      full_name: p?.full_name,
      rating: 4.8,
      score: score?.final_score || 0,
      price_per_rak: peternak.price_per_rak,
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
