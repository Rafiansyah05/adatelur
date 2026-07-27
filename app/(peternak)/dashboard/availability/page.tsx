import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AvailabilityManager } from '@/components/peternak/AvailabilityManager';

export const dynamic = 'force-dynamic';

export default async function AvailabilityPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: peternakDetails } = await supabase
    .from('peternak_details')
    .select('id, verification_status')
    .eq('profile_id', user.id)
    .single();

  if (!peternakDetails) {
    redirect('/peternak/register');
  }

  if (peternakDetails.verification_status !== 'approved') {
    redirect('/dashboard');
  }

  const { data: existingListing } = await supabase
    .from('listings')
    .select('*')
    .eq('peternak_id', peternakDetails.id)
    .maybeSingle();

  const { data: slots } = await supabase
    .from('delivery_slots')
    .select('*')
    .eq('peternak_id', peternakDetails.id)
    .order('start_time', { ascending: true });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900">Atur Ketersediaan</h1>
        <p className="text-body text-text-desc mt-1">
          Atur harga, stok, dan sesi jam operasional Anda.
        </p>
      </div>
      <AvailabilityManager initialListing={existingListing ?? null} initialSlots={slots ?? []} />
    </div>
  );
}
