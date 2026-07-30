import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_default');

function getSiteUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'Alamat email ini tidak terdaftar di sistem kami.' }, { status: 404 });
    }

    const siteUrl = getSiteUrl(request);
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
    });

    if (linkError || (!linkData?.properties?.email_otp && !linkData?.properties?.hashed_token)) {
      return NextResponse.json({ error: linkError?.message || 'Gagal membuat tautan pemulihan' }, { status: 500 });
    }

    const otp = linkData.properties.email_otp;
    const tokenHash = linkData.properties.hashed_token;

    const resetLink = otp
      ? `${siteUrl}/auth/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${otp}`
      : `${siteUrl}/auth/reset-password?token_hash=${tokenHash}&type=recovery`;

    const { error: emailError } = await resend.emails.send({
      from: 'Adatelur <no-reply@pradatelyu.online>',
      to: [normalizedEmail],
      subject: 'Atur Ulang Kata Sandi - adatelur',
      html: `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atur Ulang Kata Sandi - adatelur</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #0f172a; text-align: left;">
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">adatelur.</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #334155;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Atur Ulang Kata Sandi</h1>
              <p style="margin: 0 0 20px 0;">Halo ${profile.full_name || 'Pengguna Adatelur'},</p>
              <p style="margin: 0 0 24px 0;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda di <strong>adatelur</strong>. Silakan klik tombol di bawah ini untuk melanjutkan:</p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #facc15;">
                    <a href="${resetLink}" target="_blank" style="font-size: 15px; font-weight: 700; color: #0f172a; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; background-color: #facc15;">
                      Atur Ulang Kata Sandi Saya
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Tautan ini berlaku terbatas demi keamanan akun Anda. Apabila Anda tidak meminta perubahan ini, abaikan email ini dan kata sandi Anda tetap aman.
              </p>

              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; word-break: break-all;">
                Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke peramban web Anda:<br>
                <a href="${resetLink}" style="color: #2563eb; text-decoration: underline;">${resetLink}</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
              &copy; ${new Date().getFullYear()} adatelur. Hak cipta dilindungi undang-undang.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (emailError) {
      return NextResponse.json({ error: 'Gagal mengirim email: ' + emailError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Link reset password berhasil dikirim' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
