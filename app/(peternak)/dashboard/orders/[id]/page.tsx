import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrderDetail, type OrderDetailData } from '@/components/peternak/OrderDetail';

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
    .select('id, verification_status')
    .eq('profile_id', user.id)
    .single();

  if (!peternakDetail) {
    redirect('/peternak/register');
  }

  if (peternakDetail.verification_status !== 'approved') {
    redirect('/dashboard');
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select(
      `
      *,
      consumer:profiles!orders_consumer_id_fkey(full_name, phone_number),
      consumer_address:consumer_addresses(full_address, latitude, longitude),
      delivery_slot:delivery_slots(start_time, end_time)
    `
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!order || order.peternak_id !== peternakDetail.id) {
    return (
      <div className="w-full">
        <h1 className="text-h1 text-text-main">Pesanan tidak ditemukan</h1>
        <p className="text-body text-text-desc mt-1">
          Pesanan ini tidak ada atau bukan milik Anda.
        </p>
      </div>
    );
  }

  return <OrderDetail order={order as unknown as OrderDetailData} />;
}
