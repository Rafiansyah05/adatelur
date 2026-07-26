import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PeternakOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: peternakDetail } = await supabase
    .from('peternak_details')
    .select('verification_status')
    .eq('profile_id', user.id)
    .single();

  if (!peternakDetail) {
    redirect('/peternak/register');
  }

  if (peternakDetail.verification_status !== 'approved') {
    redirect('/dashboard');
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-h1 text-text-main">Detail Pesanan</h1>
        <p className="text-body text-text-desc mt-1">Order #{params.id.slice(0, 8).toUpperCase()}</p>
      </div>
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <p className="text-body text-text-desc">Halaman detail pesanan akan segera hadir.</p>
      </div>
    </div>
  );
}
