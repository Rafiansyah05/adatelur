import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const WEEKS = 8;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

interface CompletedOrder {
  total_amount: number;
  rak_quantity: number;
  created_at: string;
}

interface RatingRow {
  rating_value: number;
  created_at: string;
}

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: peternakDetail, error: peternakError } = await supabase
      .from('peternak_details')
      .select('id, verification_status')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (peternakError) {
      return NextResponse.json({ error: peternakError.message }, { status: 500 });
    }

    if (!peternakDetail || peternakDetail.verification_status !== 'approved') {
      return NextResponse.json({ error: 'Akun peternak belum disetujui' }, { status: 403 });
    }

    // Fetch orders, ratings (for chart trend), and peternak_scores (source of truth)
    const [{ data: orders }, { data: ratings }, { data: score }] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount, rak_quantity, created_at')
        .eq('peternak_id', peternakDetail.id)
        .eq('order_status', 'completed'),
      supabase
        .from('ratings')
        .select('rating_value, created_at')
        .eq('peternak_id', peternakDetail.id),
      supabase
        .from('peternak_scores')
        .select('delivery_accuracy_pct, final_score, average_rating')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
    ]);

    const completedOrders: CompletedOrder[] = orders ?? [];
    const ratingRows: RatingRow[] = ratings ?? [];

    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const totalRakSold = completedOrders.reduce((sum, order) => sum + Number(order.rak_quantity), 0);
    const totalCompletedOrders = completedOrders.length;

    // averageRating and finalScore come from peternak_scores — SAME source as consumer card
    // This ensures dashboard and consumer view always show identical values
    const averageRating = Number(score?.average_rating ?? 0);
    const finalScore = Number(score?.final_score ?? 0);
    const deliveryAccuracy = Number(score?.delivery_accuracy_pct ?? 0);

    const now = Date.now();

    // Weekly revenue chart data
    const weekly = Array.from({ length: WEEKS }, (_, index) => {
      const weeksAgo = WEEKS - 1 - index;
      const start = new Date(now - weeksAgo * MS_PER_WEEK);
      return {
        label: start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue: 0,
        rakSold: 0,
      };
    });

    for (const order of completedOrders) {
      const weeksAgo = Math.floor((now - new Date(order.created_at).getTime()) / MS_PER_WEEK);
      if (weeksAgo >= 0 && weeksAgo < WEEKS) {
        const bucket = weekly[WEEKS - 1 - weeksAgo];
        bucket.revenue += Number(order.total_amount);
        bucket.rakSold += Number(order.rak_quantity);
      }
    }

    // Weekly rating trend chart — uses ratings table for per-week breakdown
    // null means no ratings that week (chart will skip/gap), 0 would be misleading
    const ratingBuckets = Array.from({ length: WEEKS }, (_, index) => {
      const weeksAgo = WEEKS - 1 - index;
      const start = new Date(now - weeksAgo * MS_PER_WEEK);
      return {
        label: start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        total: 0,
        count: 0,
      };
    });

    for (const rating of ratingRows) {
      const weeksAgo = Math.floor((now - new Date(rating.created_at).getTime()) / MS_PER_WEEK);
      if (weeksAgo >= 0 && weeksAgo < WEEKS) {
        const bucket = ratingBuckets[WEEKS - 1 - weeksAgo];
        bucket.total += rating.rating_value;
        bucket.count += 1;
      }
    }

    const ratingTrend = ratingBuckets.map((bucket) => ({
      label: bucket.label,
      // null when no ratings that week so chart shows gap instead of misleading 0
      averageRating: bucket.count > 0 ? Number((bucket.total / bucket.count).toFixed(2)) : null,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalRakSold,
        completedOrders: totalCompletedOrders,
        averageRating: Number(averageRating.toFixed(2)),
        deliveryAccuracy,
        finalScore,
      },
      weekly,
      ratingTrend,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
