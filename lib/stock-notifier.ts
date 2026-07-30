import { sendWhatsAppMessage } from './fonnte';

export async function handleStockCheck(supabase: any, peternakId: string) {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('id, stock_rak, is_listing_active, updated_at')
      .eq('peternak_id', peternakId)
      .maybeSingle();

    if (!listing || listing.stock_rak <= 0) return;

    const startOfTodayMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const listingUpdatedMs = listing?.updated_at ? new Date(listing.updated_at).getTime() : 0;
    const cutoffTime = new Date(Math.max(startOfTodayMs, listingUpdatedMs)).toISOString();

    const { data: orders } = await supabase
      .from('orders')
      .select('rak_quantity')
      .eq('peternak_id', peternakId)
      .eq('payment_status', 'paid')
      .gte('created_at', cutoffTime);

    const soldSinceUpdate = (orders ?? []).reduce((sum: number, o: any) => sum + Number(o.rak_quantity), 0);

    if (soldSinceUpdate >= listing.stock_rak) {
      const { data: peternak } = await supabase
        .from('peternak_details')
        .select('profile_id')
        .eq('id', peternakId)
        .maybeSingle();

      if (peternak?.profile_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone_number, full_name')
          .eq('id', peternak.profile_id)
          .maybeSingle();

        if (profile?.phone_number) {
          const message =
            `*Pemberitahuan adatelur - Stok Habis!*\n\n` +
            `Halo ${profile.full_name},\n` +
            `Stok telur harian Anda batch terbaru sudah habis terjual (*${soldSinceUpdate}/${listing.stock_rak} rak*).\n\n` +
            `Untuk sementara, Anda tidak akan masuk dalam rekomendasi konsumen sampai Anda memperbarui stok.\n\n` +
            `Silakan perbarui stok rak Anda melalui tautan di bawah ini:\n` +
            `https://adatelur/dashboard/availability`;

          await sendWhatsAppMessage(profile.phone_number, message);
        }
      }
    }
  } catch (err) {
    console.error('Error in handleStockCheck:', err);
  }
}
