import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_default');

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate password recovery link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
      }
    });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const resetLink = linkData.properties.action_link;

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Adatelur <no-reply@pradatelyu.online>',
      to: [email],
      subject: 'Reset Password Akun Adatelur Anda',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #EBEBEB; border-radius: 12px;">
          <h2 style="color: #001224; text-align: center;">Reset Password</h2>
          <p style="color: #4B5563; font-size: 16px; line-height: 1.5;">
            Halo,<br><br>
            Kami menerima permintaan untuk mereset password akun Adatelur Anda. Silakan klik tombol di bawah ini untuk membuat password baru:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #FFD500; color: #001224; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #4B5563; font-size: 14px; line-height: 1.5;">
            Jika Anda tidak meminta reset password ini, abaikan email ini. Tautan ini hanya berlaku sementara.
          </p>
        </div>
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
