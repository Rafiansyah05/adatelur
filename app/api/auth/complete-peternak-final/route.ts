import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, password, otpToken, nama, phone,
      birthDate, address, lat, lng,
      registrationMethod, chickenCount, eggProd, eggBroken, eggClean, feedType, experience,
      hasVehicle, vehicleType
    } = body;

    if (!email || !password || !otpToken) {
      return NextResponse.json({ error: 'Data registrasi tidak lengkap.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Verifikasi OTP dari database otps
    const { data: otpRecord, error: otpError } = await adminClient
      .from('otps')
      .select('id')
      .eq('email', email)
      .eq('otp_code', otpToken)
      .eq('is_used', true) // Harus sudah ditandai true saat tahap 2
      .maybeSingle();

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'Kode OTP tidak valid atau sesi kadaluarsa.' }, { status: 400 });
    }

    // 2. Buat User di auth.users
    let userId;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: nama,
        phone_number: phone,
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        const { data: searchData } = await adminClient.auth.admin.listUsers();
        const existingUser = searchData.users.find(u => u.email === email);
        if (existingUser) {
           userId = existingUser.id;
           await adminClient.auth.admin.updateUserById(userId, { password, email_confirm: true });
        } else {
           return NextResponse.json({ error: 'Gagal membuat user: ' + authError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Gagal membuat user: ' + authError.message }, { status: 500 });
      }
    } else {
      userId = authData.user.id;
    }

    // 3. Masukkan ke tabel profiles
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: userId,
      role: 'peternak',
      full_name: nama,
      phone_number: phone,
      email: email
    });

    if (profileError) {
      return NextResponse.json({ error: 'Gagal membuat profil: ' + profileError.message }, { status: 500 });
    }

    // 4. Masukkan data ke peternak_details
    const { data: pData, error: pError } = await adminClient
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

    if (pError) {
      throw new Error('Gagal menyimpan data operasional peternak: ' + pError.message);
    }

    const peternakId = pData.id;

    // 5. Masukkan kendaraan
    if (hasVehicle && vehicleType) {
      await adminClient.from('vehicles').insert({ 
        peternak_id: peternakId, 
        vehicle_type: vehicleType 
      });
    }

    return NextResponse.json({ success: true, peternakId: peternakId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
