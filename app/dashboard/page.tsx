import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PeternakDashboard } from '@/components/peternak/PeternakDashboard';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'peternak') {
    redirect('/');
  }

  const { data: peternakDetail } = await supabase
    .from('peternak_details')
    .select('id, verification_status')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!peternakDetail) {
    redirect('/register/peternak');
  }

  if (peternakDetail.verification_status === 'approved') {
    const { data: listing } = await supabase
      .from('listings')
      .select('id, price_per_rak, stock_rak, is_listing_active, listing_date')
      .eq('peternak_id', peternakDetail.id)
      .order('listing_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: slots } = await supabase
      .from('delivery_slots')
      .select('id, slot_date, start_time, end_time, is_active')
      .eq('peternak_id', peternakDetail.id)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true });

    return <PeternakDashboard initialListing={listing ?? null} initialSlots={slots ?? []} />;
  }

  if (peternakDetail.verification_status === 'rejected') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-4">
        <div className="max-w-md rounded-md border border-border bg-white p-6 text-center">
          <h1 className="text-h1 text-text-main">Pendaftaran Anda ditolak</h1>
          <p className="mt-3 text-body text-text-desc">
            Silakan hubungi Customer Service untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="max-w-md rounded-md border border-border bg-white p-6 text-center">
        <h1 className="text-h1 text-text-main">Menunggu verifikasi</h1>
        <p className="mt-3 text-body text-text-desc">
          Dashboard akan terbuka setelah peternakan Anda disetujui.
        </p>
      </div>
    </div>
  );
}
