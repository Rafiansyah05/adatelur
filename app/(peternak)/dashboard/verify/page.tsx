import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function VerificationPendingPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: peternakDetails, error: detailsError } = await supabase
    .from('peternak_details')
    .select('verification_status')
    .eq('profile_id', user.id)
    .single();

  if (detailsError || !peternakDetails) {
    redirect('/peternak/register');
  }

  if (peternakDetails.verification_status === 'approved') {
    redirect('/dashboard');
  }

  if (peternakDetails.verification_status === 'rejected') {
    redirect('/dashboard/rejected');
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-cream px-4 py-8 text-center w-full rounded-md mt-4">
      <span className="mb-4 text-[48px]">⏳</span>
      <h1 className="mb-2 text-h2 text-text-main">Menunggu Verifikasi</h1>
      <p className="text-[14px] text-text-desc max-w-xl">
        Profil peternakan Anda sedang ditinjau oleh tim kami. Silakan cek kembali nanti atau hubungi
        CS jika Anda membutuhkan bantuan.
      </p>
    </div>
  );
}
