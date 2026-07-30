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

  let remainingStock = existingListing?.stock_rak ?? 0;
  if (existingListing) {
    const startOfTodayMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const listingUpdatedMs = existingListing.updated_at ? new Date(existingListing.updated_at).getTime() : 0;
    const cutoffTime = new Date(Math.max(startOfTodayMs, listingUpdatedMs)).toISOString();

    const { data: paidOrders } = await supabase
      .from('orders')
      .select('rak_quantity')
      .eq('peternak_id', peternakDetails.id)
      .eq('payment_status', 'paid')
      .gte('created_at', cutoffTime);

    const soldSinceUpdate = (paidOrders ?? []).reduce((sum, order) => sum + Number(order.rak_quantity), 0);
    remainingStock = Math.max(0, (existingListing.stock_rak ?? 0) - soldSinceUpdate);
  }

  const listingWithRemaining = existingListing
    ? { ...existingListing, remaining_stock: remainingStock }
    : null;

  return (
    <div className="w-full">
      <div className="mb-6 hidden md:block">
        <h1 className="text-3xl font-extrabold text-neutral-900">Atur Ketersediaan</h1>
        <p className="text-body text-text-desc font-medium mt-1">
          Atur harga, stok, dan sesi jam operasional Anda.
        </p>
      </div>
      <AvailabilityManager initialListing={listingWithRemaining} initialSlots={slots ?? []} />
    </div>
  );
}
