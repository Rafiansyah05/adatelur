import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      birthDate, address, lat, lng,
      registrationMethod, chickenCount, eggProd, eggBroken, eggClean, feedType, experience,
      hasVehicle, vehicleType
    } = body;

    const adminClient = createAdminClient();

    // 1. Update Peternak Details (it was inserted during verify-otp with empty defaults)
    const updatePayload: any = {
      registration_method: registrationMethod || 'self_form',
      chicken_count: parseInt(chickenCount) || 0,
      daily_egg_production: parseInt(eggProd) || 0,
      daily_damaged_eggs: parseInt(eggBroken) || 0,
      daily_clean_eggs: parseInt(eggClean) || 0,
      feed_type: feedType || '-',
      farming_experience_years: parseFloat(experience) || 0,
      has_vehicle: hasVehicle || false,
      verification_status: 'pending',
    };

    if (birthDate) updatePayload.birth_date = birthDate;
    if (address && address !== '-') updatePayload.farm_address = address;
    if (lat) updatePayload.farm_latitude = lat;
    if (lng) updatePayload.farm_longitude = lng;

    const { data: pData, error: pError } = await adminClient
      .from('peternak_details')
      .update(updatePayload)
      .eq('profile_id', user.id)
      .select()
      .single();

    if (pError) throw new Error('Gagal menyimpan data peternak: ' + pError.message);

    const peternakId = pData.id;

    // 2. Insert Kendaraan (jika ada)
    if (hasVehicle && vehicleType) {
      const { error: vError } = await adminClient
        .from('vehicles')
        .insert({ peternak_id: peternakId, vehicle_type: vehicleType });
      if (vError) console.warn('Kendaraan gagal disimpan', vError);
    }

    return NextResponse.json({ success: true, peternakId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
