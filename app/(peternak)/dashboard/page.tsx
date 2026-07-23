import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ListingManager } from '@/components/dashboard/ListingManager';
import { DeliverySlotsManager } from '@/components/dashboard/DeliverySlotsManager';

export const dynamic = 'force-dynamic';

export default async function PeternakDashboard() {
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
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (detailsError || !peternakDetails) {
    redirect('/peternak/register');
  }

  if (
    peternakDetails.verification_status === 'pending' ||
    peternakDetails.verification_status === 'in_review'
  ) {
    redirect('/dashboard/verify');
  }

  if (peternakDetails.verification_status === 'rejected') {
    redirect('/dashboard/rejected');
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
    <div className="w-full px-6 py-8">
      <h1 className="text-display text-text-main">Berhasil masuk: Dashboard Peternak</h1>
      <p className="mt-2 text-text-main">Anda memiliki akses peternak yang terverifikasi.</p>
    </div>
  );
}
