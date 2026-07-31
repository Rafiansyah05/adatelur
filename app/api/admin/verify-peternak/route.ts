import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_default');

export async function POST(request: Request) {
  try {
    const { profileId, peternakId, email, name, action, reason } = await request.json();
    const adminClient = createAdminClient();

    if (action === 'approve') {
      const { error } = await adminClient
        .from('peternak_details')
        .update({ verification_status: 'approved' })
        .eq('id', peternakId);

      if (error) throw error;


      const { error: emailError } = await resend.emails.send({
        from: 'Adatelur Admin <noreply@pradatelyu.online>',
        to: email,
        subject: 'Selamat! Akun Peternak Anda Telah Terverifikasi 🎉',
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>Halo, ${name}!</h2>
            <p>Selamat! Akun peternak Anda di Adatelur telah berhasil diverifikasi oleh tim kami.</p>
            <p>Sekarang Anda sudah bisa mulai menggunakan seluruh fitur Adatelur untuk mengelola dan memasarkan telur Anda.</p>
            <p>Terima kasih telah bergabung bersama kami!</p>
            <p><br>Salam hangat,<br>Tim Adatelur</p>
          </div>
        `
      });

      if (emailError) {
        return NextResponse.json({ success: true, warning: 'Aksi berhasil, tetapi email gagal dikirim oleh Resend. Pesan error: ' + emailError.message });
      }

      return NextResponse.json({ success: true });
    } else if (action === 'reject') {
      const { error } = await adminClient.auth.admin.deleteUser(profileId);
      if (error) throw error;
      const { error: emailError } = await resend.emails.send({
        from: 'Adatelur Admin <noreply@pradatelyu.online>',
        to: email,
        subject: 'Pembaruan Status Pendaftaran Peternak Adatelur',
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; line-height: 1.5;">
            <h2>Halo, ${name}</h2>
            <p>Terima kasih atas ketertarikan Anda untuk bergabung sebagai Mitra Peternak di Adatelur.</p>
            <p>Mohon maaf, setelah melakukan peninjauan terhadap data Anda, saat ini kami <strong>belum dapat menyetujui</strong> pendaftaran Anda karena alasan berikut:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
              <p style="margin: 0;"><em>"${reason}"</em></p>
            </div>
            <p>Jangan berkecil hati! Kami akan sangat senang jika Anda ingin memperbaiki data Anda dan <strong>mendaftar kembali di lain waktu</strong> saat dirasa sudah sesuai.</p>
            <p>Semoga sukses selalu dengan usaha peternakan Anda.</p>
            <p><br>Salam hangat,<br>Tim Adatelur</p>
          </div>
        `
      });

      if (emailError) {
        return NextResponse.json({ success: true, warning: 'Aksi berhasil, tetapi email gagal dikirim oleh Resend. Pesan error: ' + emailError.message });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Verify peternak error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
