import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function RejectedPage() {
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

  if (
    peternakDetails.verification_status === 'pending' ||
    peternakDetails.verification_status === 'in_review'
  ) {
    redirect('/dashboard/verify');
  }

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-primary-50 px-4 py-8 text-center w-full rounded-md mt-4">
      <span className="mb-4 text-[48px]">❌</span>
      <h1 className="mb-2 text-h2 text-text-main">Verifikasi Ditolak</h1>
      <p className="text-[14px] text-text-desc max-w-xl">
        Maaf, pendaftaran Anda tidak memenuhi kriteria. Silakan hubungi tim dukungan jika Anda ingin
        mengajukan ulang atau mendapatkan klarifikasi.
      </p>
    </div>
  );
}
