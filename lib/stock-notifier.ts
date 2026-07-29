import { sendWhatsAppMessage } from './fonnte';

export async function handleStockCheck(supabase: any, peternakId: string) {
  try {
    // 1. Fetch listing details
    const { data: listing } = await supabase
      .from('listings')
      .select('id, stock_rak, is_listing_active')
      .eq('peternak_id', peternakId)
      .maybeSingle();

    if (!listing || listing.stock_rak <= 0) return;

    // 2. Fetch today's accepted/completed orders
    const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: orders } = await supabase
      .from('orders')
      .select('rak_quantity, created_at')
      .eq('peternak_id', peternakId)
      .in('order_status', ['accepted', 'completed', 'in_delivery']);

    let todayRakSold = 0;
    for (const o of orders ?? []) {
      const orderDateStr = new Date(new Date(o.created_at).getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (orderDateStr === todayStr) {
        todayRakSold += Number(o.rak_quantity);
      }
    }

    // 3. Check if today's sold quantity meets or exceeds stock_rak
    if (todayRakSold >= listing.stock_rak) {
      const originalStock = listing.stock_rak;
      
      // Set stock to 0 to prevent further recommendations
      await supabase
        .from('listings')
        .update({ stock_rak: 0, updated_at: new Date().toISOString() })
        .eq('id', listing.id);

      // Fetch peternak phone number
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
            `Stok telur harian Anda hari ini sudah habis terjual (*${todayRakSold}/${originalStock} rak*).\n\n` +
            `Untuk sementara, Anda tidak akan masuk dalam rekomendasi konsumen sampai Anda memperbarui stok.\n\n` +
            `Silakan perbarui stok rak Anda melalui tautan di bawah ini:\n` +
            `https://adatelur.com/dashboard/availability`;

          await sendWhatsAppMessage(profile.phone_number, message);
        }
      }
    }
  } catch (err) {
    console.error('Error in handleStockCheck:', err);
  }
}
