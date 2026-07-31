import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone_number,
        created_at,
        peternak_details!inner (
          id,
          registration_method,
          verification_status,
          chicken_count,
          feed_type,
          daily_egg_production,
          daily_damaged_eggs,
          daily_clean_eggs,
          farming_experience_years,
          has_vehicle,
          farm_address,
          peternak_verification_photos (
            photo_type,
            photo_url
          ),
          vehicles (
            vehicle_type
          )
        )
      `)
      .eq('role', 'peternak')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API admin/peternak error:', error);
      return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }

    console.log("Admin peternak data:", data);

    const flattenedData = data.map((p: any) => {
      const pd = Array.isArray(p.peternak_details) ? p.peternak_details[0] : p.peternak_details;
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        phone_number: p.phone_number,
        created_at: p.created_at,
        peternak_id: pd?.id,
        registration_method: pd?.registration_method,
        verification_status: pd?.verification_status,
        chicken_count: pd?.chicken_count,
        feed_type: pd?.feed_type,
        daily_egg_production: pd?.daily_egg_production,
        daily_damaged_eggs: pd?.daily_damaged_eggs,
        daily_clean_eggs: pd?.daily_clean_eggs,
        farming_experience_years: pd?.farming_experience_years,
        has_vehicle: pd?.has_vehicle,
        farm_address: pd?.farm_address,
        photos: pd?.peternak_verification_photos || [],
        vehicles: pd?.vehicles || []
      };
    });

    return NextResponse.json({ success: true, data: flattenedData });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
