import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ListingManager } from '@/components/dashboard/ListingManager';
import { DeliverySlotsManager } from '@/components/dashboard/DeliverySlotsManager';

export const dynamic = 'force-dynamic';

export default async function PeternakDashboard() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: peternakDetails, error: detailsError } = await supabase
    .from('peternak_details')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (detailsError || !peternakDetails) {
    redirect('/peternak/register');
  }

  if (peternakDetails.verification_status === 'pending' || peternakDetails.verification_status === 'in_review') {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-cream px-4 py-8 text-center w-full rounded-md mt-4">
        <span className="mb-4 text-[48px]">⏳</span>
        <h1 className="mb-2 text-h2 text-text-main">Menunggu Verifikasi</h1>
        <p className="text-[14px] text-text-desc">
          Profil peternakan Anda sedang ditinjau oleh tim kami. Silakan cek kembali nanti.
        </p>
      </div>
    );
  }

  if (peternakDetails.verification_status === 'rejected') {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-primary-50 px-4 py-8 text-center w-full rounded-md mt-4">
        <span className="mb-4 text-[48px]">❌</span>
        <h1 className="mb-2 text-h2 text-text-main">Verifikasi Ditolak</h1>
        <p className="text-[14px] text-text-desc">
          Maaf, pendaftaran Anda tidak memenuhi kriteria.
        </p>
      </div>
    );
  }

  const todayDateStr = new Date().toISOString().split('T')[0];

  const { data: existingListing } = await supabase
    .from('listings')
    .select('*')
    .eq('peternak_id', peternakDetails.id)
    .eq('listing_date', todayDateStr)
    .single();

  const { data: slots } = await supabase
    .from('delivery_slots')
    .select('*')
    .eq('peternak_id', peternakDetails.id)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  return (
    <div className="w-full">
      <div className="bg-primary-50 px-4 py-8">
        <h1 className="mb-2 text-display text-text-main">Dashboard Peternak</h1>
        <p className="text-[14px] text-text-main">Kelola harga, stok, dan jadwal pengiriman Anda hari ini.</p>
      </div>
      <div className="px-4 py-6">
        <ListingManager initialData={existingListing} />
        <DeliverySlotsManager initialSlots={slots || []} />
      </div>
    </div>
  );
}
