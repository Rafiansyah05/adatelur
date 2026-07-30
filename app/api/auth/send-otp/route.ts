import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function getEmailTemplate(otp: string) {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode Verifikasi Adatelur</title>
  <style>
    @import url('https://fonts.googleapis.css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 40px 20px;
      color: #171717;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      border: 1px solid #e5e7eb;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #171717;
      margin-bottom: 24px;
      text-align: center;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: #525252;
      margin-bottom: 32px;
      text-align: center;
    }
    .otp-container {
      background-color: #f3f4f6;
      border-radius: 6px;
      padding: 24px;
      text-align: center;
      margin-bottom: 32px;
    }
    .otp {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 4px;
      color: #171717;
      margin: 0;
    }
    .footer {
      font-size: 13px;
      color: #a3a3a3;
      text-align: center;
      margin-top: 32px;
      border-top: 1px solid #e5e7eb;
      padding-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">adatelur.</div>
    <div class="title">Verifikasi Email Anda</div>
    <div class="text">
      Terima kasih telah mendaftar di Adatelur. Gunakan kode verifikasi berikut untuk menyelesaikan pendaftaran akun Anda. Kode ini berlaku selama 5 menit.
    </div>
    <div class="otp-container">
      <p class="otp">${otp}</p>
    </div>
    <div class="text">
      Jika Anda tidak merasa mendaftar, silakan abaikan email ini.
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Adatelur. Hak Cipta Dilindungi.
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ error: 'Email ini sudah terdaftar. Silakan masuk atau pakai email lain.' }, { status: 400 });
    }

    let meta = body;
    if (!body.password) {
      const { data: previousOtp } = await adminClient
        .from('otps')
        .select('metadata')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!previousOtp || !previousOtp.metadata) {
        return NextResponse.json({ error: 'Data registrasi tidak ditemukan, silakan daftar ulang.' }, { status: 400 });
      }
      meta = previousOtp.metadata;
    }

    const targetRole = body.role || meta?.role;
    const targetPhone = body.phone || meta?.phone;

    if (targetPhone && (targetRole === 'peternak' || body.farmName || meta?.farmName)) {
      const digits = targetPhone.replace(/\D/g, '');
      const baseDigits = digits.startsWith('62')
        ? digits.slice(2)
        : digits.startsWith('0')
          ? digits.slice(1)
          : digits;
      const phoneVariations = [
        baseDigits,
        `0${baseDigits}`,
        `62${baseDigits}`,
        `+62${baseDigits}`,
      ];

      const { data: existingPeternak } = await adminClient
        .from('profiles')
        .select('id')
        .eq('role', 'peternak')
        .in('phone_number', phoneVariations)
        .maybeSingle();

      if (existingPeternak) {
        return NextResponse.json(
          { error: 'Nomor telepon ini sudah terdaftar untuk peternak lain. Silakan gunakan nomor telepon lain.' },
          { status: 400 }
        );
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const { error: insertError } = await adminClient.from('otps').insert({
      email,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
      metadata: meta,
    });

    if (insertError) {
      console.error('Gagal menyimpan OTP:', insertError);
      return NextResponse.json({ error: 'Terjadi kesalahan sistem saat membuat kode.' }, { status: 500 });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Adatelur <noreply@pradatelyu.online>',
      to: email,
      subject: 'Kode Verifikasi Pendaftaran Adatelur',
      html: getEmailTemplate(otpCode),
    });

    if (emailError) {
      console.error('Gagal mengirim email lewat Resend:', emailError);
      return NextResponse.json({ error: 'Gagal mengirim email. Pastikan alamat email valid.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Kode OTP telah dikirim' });
  } catch (err) {
    console.error('API send-otp error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan tidak terduga' }, { status: 500 });
  }
}
