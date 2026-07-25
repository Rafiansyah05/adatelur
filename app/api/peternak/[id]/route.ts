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

    const { data: listing, error: peternakError } = await supabase
      .from('public_listings')
      .select('*')
      .eq('peternak_id', peternakId)
      .limit(1)
      .single();

    if (peternakError || !listing) {
      return NextResponse.json({ error: 'Peternak not found' }, { status: 404 });
    }

    const peternak = {
      id: peternakId,
      farm_address: 'Lokasi peternak (Detail alamat tersedia setelah pesanan diterima)',
      farm_latitude: listing.farm_latitude,
      farm_longitude: listing.farm_longitude,
      profiles: {
        full_name: listing.peternak_name,
        avatar_url: listing.avatar_url,
      },
      peternak_scores: {
        final_score: listing.final_score,
        average_rating: 4.8,
      },
      listing_id: listing.listing_id ?? listing.id,
      price_per_rak: listing.price_per_rak,
      is_available: listing.is_available,
    };

    const adminClient = createAdminClient();
    const todayDateStr = new Date().toISOString().split('T')[0];

    const { data: deliverySlots, error: slotsError } = await adminClient
      .from('delivery_slots')
      .select('*')
      .eq('peternak_id', peternakId)
      .eq('is_active', true)
      .gte('slot_date', todayDateStr)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 });
    }

    const responseData = {
      id: peternakId,
      full_name: listing.peternak_name,
      rating: 4.8,
      score: listing.final_score,
      price_per_rak: listing.price_per_rak,
      farm_latitude: listing.farm_latitude,
      farm_longitude: listing.farm_longitude,
      listing_id: listing.listing_id ?? listing.id,
      delivery_slots: deliverySlots || [],
    };

    return NextResponse.json({ data: responseData });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
