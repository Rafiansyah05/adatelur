import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PeternakDashboard } from '@/components/peternak/PeternakDashboard';

export const dynamic = 'force-dynamic';

export default async function PeternakDashboardPage() {
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

  const { data: existingListing } = await supabase
    .from('listings')
    .select('*')
    .eq('peternak_id', peternakDetails.id)
    .single();

  const { data: slots } = await supabase
    .from('delivery_slots')
    .select('*')
    .eq('peternak_id', peternakDetails.id)
    .order('start_time', { ascending: true });

  return <PeternakDashboard initialListing={existingListing ?? null} initialSlots={slots ?? []} />;
}
