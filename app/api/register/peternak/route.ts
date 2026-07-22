import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      nama,
      phone,
      birthDate,
      address,
      lat,
      lng,
      registrationMethod,
      chickenCount,
      eggProd,
      eggBroken,
      eggClean,
      feedType,
      hasVehicle,
      vehicleType,
      experience,
    } = body;

    // Validasi input dasar
    if (!email || !password || !nama || !phone || !birthDate || !address || lat == null || lng == null) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }

    // 1. Signup user via anon client (agar tidak perlu konfirmasi email untuk dapat user id)
    const anonClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({ email, password });
    if (signUpError) {
      return NextResponse.json({ error: 'Gagal membuat akun: ' + signUpError.message }, { status: 400 });
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Gagal mendapatkan ID pengguna.' }, { status: 500 });
    }

    // 2. Gunakan admin client (service role) untuk bypass RLS
    const admin = createAdminClient();

    // Insert profil
    const { error: profileError } = await admin
      .from('profiles')
      .insert({ id: userId, role: 'peternak', full_name: nama, phone_number: phone, email });

    if (profileError) {
      // Hapus user auth jika profil gagal dibuat
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Gagal menyimpan profil: ' + profileError.message }, { status: 500 });
    }

    // Insert peternak_details
    const { data: peternakData, error: peternakError } = await admin
      .from('peternak_details')
      .insert({
        profile_id: userId,
        birth_date: birthDate,
        farm_address: address,
        farm_latitude: lat,
        farm_longitude: lng,
        registration_method: registrationMethod || 'self_form',
        chicken_count: parseInt(chickenCount) || 0,
        daily_egg_production: parseInt(eggProd) || 0,
        daily_damaged_eggs: parseInt(eggBroken) || 0,
        daily_clean_eggs: parseInt(eggClean) || 0,
        feed_type: feedType || '-',
        farming_experience_years: parseFloat(experience) || 0,
        has_vehicle: hasVehicle || false,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (peternakError) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Gagal menyimpan data peternak: ' + peternakError.message }, { status: 500 });
    }

    const peternakId = peternakData.id;

    // Insert kendaraan jika ada
    if (hasVehicle && vehicleType) {
      await admin.from('vehicles').insert({ peternak_id: peternakId, vehicle_type: vehicleType });
    }

    return NextResponse.json({ success: true, peternakId, userId });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
