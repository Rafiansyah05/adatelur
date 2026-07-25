import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email dan token wajib diisi.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Cari OTP yang valid
    const { data: otpRecord, error: otpError } = await adminClient
      .from('otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', token)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error('Database error checking OTP:', otpError);
      return NextResponse.json({ error: 'Kesalahan sistem saat memeriksa OTP.' }, { status: 500 });
    }

    if (!otpRecord) {
      return NextResponse.json({ error: 'Kode OTP tidak valid atau sudah kedaluwarsa.' }, { status: 400 });
    }

    // 2. Tandai OTP sebagai digunakan
    await adminClient.from('otps').update({ is_used: true }).eq('id', otpRecord.id);

    // 3. Buat User di auth.users
    const metadata = otpRecord.metadata;
    const password = metadata.password;
    const role = metadata.role || 'consumer';

    if (!password) {
      return NextResponse.json({ error: 'Data registrasi tidak lengkap.' }, { status: 400 });
    }

    let userId;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: metadata.fullName || metadata.nama,
        phone_number: metadata.phone,
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

    // 4. Masukkan ke tabel profiles
    const fullName = metadata.fullName || metadata.nama;
    const phoneNumber = metadata.phone;

    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: userId,
      role: role,
      full_name: fullName,
      phone_number: phoneNumber,
      email: email
    });

    if (profileError) {
      return NextResponse.json({ error: 'Gagal membuat profil: ' + profileError.message }, { status: 500 });
    }

    // 5. Masukkan ke peternak_details jika role === peternak
    let peternakId = null;
    if (role === 'peternak') {
      const { data: pData, error: pError } = await adminClient
        .from('peternak_details')
        .insert({
          profile_id: userId,
          birth_date: metadata.birthDate || new Date().toISOString(),
          farm_address: metadata.address || '-',
          farm_latitude: metadata.lat || 0,
          farm_longitude: metadata.lng || 0,
          registration_method: metadata.registrationMethod || 'self_form',
          chicken_count: parseInt(metadata.chickenCount) || 0,
          daily_egg_production: parseInt(metadata.eggProd) || 0,
          daily_damaged_eggs: parseInt(metadata.eggBroken) || 0,
          daily_clean_eggs: parseInt(metadata.eggClean) || 0,
          feed_type: metadata.feedType || '-',
          farming_experience_years: parseFloat(metadata.experience) || 0,
          has_vehicle: metadata.hasVehicle || false,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (pError) {
        console.warn('Gagal buat peternak details', pError);
      } else {
        peternakId = pData.id;
        
        // Simpan kendaraan (opsional)
        if (metadata.hasVehicle && metadata.vehicleType) {
          await adminClient.from('vehicles').insert({ 
            peternak_id: peternakId, 
            vehicle_type: metadata.vehicleType 
          });
        }
      }
    }

    // 6. Sign In otomatis
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.warn('Berhasil registrasi, namun gagal auto-login:', signInError);
    }

    return NextResponse.json({ success: true, peternakId });
  } catch (err) {
    console.error('API verify-otp error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan tidak terduga' }, { status: 500 });
  }
}
