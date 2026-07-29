import { createAdminClient } from '@/lib/supabase/admin';

export async function recalculatePeternakScore(peternakId: string) {
  const supabase = createAdminClient();

  // Fetch all orders
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('total_amount, order_status, fulfillment_method, id')
    .eq('peternak_id', peternakId)
    .eq('order_status', 'completed');

  if (ordersErr) throw ordersErr;

  // Calculate Transaction Score
  const totalOmzet = orders?.reduce((acc, order) => acc + Number(order.total_amount), 0) || 0;
  // Let's cap at Rp 5.000.000 for 100 points
  const transactionScore = Math.min((totalOmzet / 5000000) * 100, 100);

  // Calculate Delivery Score
  const deliveryOrders = orders?.filter(o => o.fulfillment_method === 'delivery') || [];
  let deliveryScore = 0;
  let deliveryAccuracyPct = 0;

  if (deliveryOrders.length > 0) {
    const deliveryOrderIds = deliveryOrders.map(o => o.id);
    const { data: proofs, error: proofsErr } = await supabase
      .from('delivery_proof')
      .select('is_within_slot')
      .in('order_id', deliveryOrderIds);

    if (proofsErr) throw proofsErr;

    const onTimeCount = proofs?.filter(p => p.is_within_slot).length || 0;
    deliveryAccuracyPct = (onTimeCount / deliveryOrders.length) * 100;
    deliveryScore = deliveryAccuracyPct;
  } else {
    // If no delivery orders, delivery score is neutral 100 so it doesn't penalize
    deliveryScore = 100; 
  }

  // Calculate Rating Score
  const { data: ratings, error: ratingsErr } = await supabase
    .from('ratings')
    .select('rating_value')
    .eq('peternak_id', peternakId);

  if (ratingsErr) throw ratingsErr;

  let averageRating = 0;
  let ratingScore = 0;

  if (ratings && ratings.length > 0) {
    const totalRating = ratings.reduce((acc, r) => acc + r.rating_value, 0);
    averageRating = totalRating / ratings.length;
    ratingScore = (averageRating / 5) * 100;
  } else {
    // If no rating, set averageRating to 0 and ratingScore to 0 so it displays as Baru or 0.0
    averageRating = 0;
    ratingScore = 0;
  }

  // Final Score = 50% transaction + 30% delivery + 20% rating
  const finalScore = (transactionScore * 0.5) + (deliveryScore * 0.3) + (ratingScore * 0.2);

  // Suspend if < 30
  const isSuspended = finalScore < 30 && orders && orders.length > 5; // Only suspend if they have at least 5 orders
  const suspensionReason = isSuspended ? 'Skor performa berada di bawah standar minimum (30).' : null;
  const suspendedAt = isSuspended ? new Date().toISOString() : null;

  // Upsert to peternak_scores
  const { error: upsertErr } = await supabase
    .from('peternak_scores')
    .upsert({
      peternak_id: peternakId,
      total_transaction_value: totalOmzet,
      transaction_score: transactionScore,
      delivery_accuracy_pct: deliveryAccuracyPct,
      delivery_score: deliveryScore,
      average_rating: averageRating,
      rating_score: ratingScore,
      final_score: finalScore,
      is_suspended: isSuspended,
      suspended_at: suspendedAt,
      suspension_reason: suspensionReason,
      updated_at: new Date().toISOString()
    });

  if (upsertErr) throw upsertErr;

  return { finalScore, isSuspended };
}
