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
        .select('delivery_accuracy_pct, final_score')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
    ]);

    const completedOrders: CompletedOrder[] = orders ?? [];
    const ratingRows: RatingRow[] = ratings ?? [];

    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const totalRakSold = completedOrders.reduce((sum, order) => sum + Number(order.rak_quantity), 0);
    const averageRating =
      ratingRows.length > 0
        ? ratingRows.reduce((sum, rating) => sum + rating.rating_value, 0) / ratingRows.length
        : 0;

    const now = Date.now();

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
      averageRating: bucket.count > 0 ? Number((bucket.total / bucket.count).toFixed(2)) : 0,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalRakSold,
        completedOrders: completedOrders.length,
        averageRating: Number(averageRating.toFixed(2)),
        deliveryAccuracy: Number(score?.delivery_accuracy_pct ?? 0),
        finalScore: Number(score?.final_score ?? 0),
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
