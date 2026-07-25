import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { 
      peternakId, 
      chickenCount, 
      eggProd, 
      eggBroken, 
      eggClean, 
      feedType, 
      experience, 
      hasVehicle, 
      vehicleType 
    } = await request.json();
    
    if (!peternakId) {
      return NextResponse.json({ error: 'Peternak ID tidak valid.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { error: pError } = await adminClient
      .from('peternak_details')
      .update({
        chicken_count: parseInt(chickenCount) || 0,
        daily_egg_production: parseInt(eggProd) || 0,
        daily_damaged_eggs: parseInt(eggBroken) || 0,
        daily_clean_eggs: parseInt(eggClean) || 0,
        feed_type: feedType || '-',
        farming_experience_years: parseFloat(experience) || 0,
        has_vehicle: hasVehicle || false,
      })
      .eq('id', peternakId);

    if (pError) throw pError;

    if (hasVehicle && vehicleType) {
      // Upsert vehicle (first delete existing, then insert)
      await adminClient.from('vehicles').delete().eq('peternak_id', peternakId);
      await adminClient.from('vehicles').insert({ 
        peternak_id: peternakId, 
        vehicle_type: vehicleType 
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update peternak error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
