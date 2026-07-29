import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const WEEKS = 12;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

interface CompletedOrder {
  total_amount: number;
  subtotal: number;
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

    // Get peternak detail
    const { data: peternakDetail, error: peternakError } = await supabase
      .from('peternak_details')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (peternakError || !peternakDetail) {
      return NextResponse.json({ error: 'Peternak detail not found' }, { status: 404 });
    }

    // Use admin client to bypass RLS policies
    const adminSupabase = createAdminClient();

    // Fetch orders, ratings, peternak_scores, listings, wallets, and wallet_transactions
    const [
      { data: orders },
      { data: ratings },
      { data: score },
      { data: listing },
      { data: wallet },
      { data: transactions },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount, subtotal, rak_quantity, created_at')
        .eq('peternak_id', peternakDetail.id)
        .eq('order_status', 'completed'),
      adminSupabase
        .from('ratings')
        .select('rating_value, created_at')
        .eq('peternak_id', peternakDetail.id),
      adminSupabase
        .from('peternak_scores')
        .select('delivery_accuracy_pct, final_score, average_rating')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
      supabase
        .from('listings')
        .select('stock_rak')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
      adminSupabase
        .from('wallets')
        .select('balance')
        .eq('peternak_id', peternakDetail.id)
        .maybeSingle(),
      adminSupabase
        .from('wallet_transactions')
        .select('amount, type, balance_after, created_at')
        .eq('peternak_id', peternakDetail.id)
        .order('created_at', { ascending: true }),
    ]);

    const completedOrders: CompletedOrder[] = orders ?? [];
    const ratingRows: RatingRow[] = ratings ?? [];
    const txs = transactions ?? [];

    // The nominal for total pendapatan follows the actual wallet balance (saldo)
    const totalRevenue = Number(wallet?.balance ?? 0);
    const totalRakSold = completedOrders.reduce((sum, order) => sum + Number(order.rak_quantity), 0);
    const totalCompletedOrders = completedOrders.length;

    // Calculate today's stats (WIB / UTC+7)
    const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    let todayRevenue = 0;
    let todayRakSold = 0;
    let todayCompletedOrders = 0;

    // Today's revenue matches today's credited wallet transactions
    for (const tx of txs) {
      const txDateStr = new Date(new Date(tx.created_at).getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (txDateStr === todayStr && tx.type === 'credit') {
        todayRevenue += Number(tx.amount);
      }
    }

    for (const order of completedOrders) {
      const orderDateStr = new Date(new Date(order.created_at).getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (orderDateStr === todayStr) {
        todayRakSold += Number(order.rak_quantity);
        todayCompletedOrders += 1;
      }
    }

    const averageRating = Number(score?.average_rating ?? 0);
    const finalScore = Number(score?.final_score ?? 0);
    const deliveryAccuracy = Number(score?.delivery_accuracy_pct ?? 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const endOfTodayTime = endOfToday.getTime();
    const now = Date.now();

    // 1. Daily wallet balance trend data (Last 10 days)
    const DAYS = 10;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const daily = Array.from({ length: DAYS }, (_, index) => {
      const daysAgo = DAYS - 1 - index;
      const bucketEnd = new Date(endOfTodayTime - daysAgo * MS_PER_DAY);
      return {
        label: bucketEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        endTime: bucketEnd.getTime(),
        revenue: 0,
        rakSold: 0,
      };
    });

    let lastBalance = 0;
    for (const day of daily) {
      const txsBefore = txs.filter(tx => new Date(tx.created_at).getTime() <= day.endTime);
      if (txsBefore.length > 0) {
        lastBalance = Number(txsBefore[txsBefore.length - 1].balance_after);
      }
      day.revenue = lastBalance;
    }

    // 2. Weekly wallet balance trend data (Last 12 weeks)
    const weekly = Array.from({ length: WEEKS }, (_, index) => {
      const weeksAgo = WEEKS - 1 - index;
      const bucketEnd = new Date(endOfTodayTime - weeksAgo * MS_PER_WEEK);
      return {
        label: bucketEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        endTime: bucketEnd.getTime(),
        revenue: 0,
        rakSold: 0,
      };
    });

    lastBalance = 0;
    for (const week of weekly) {
      const txsBefore = txs.filter(tx => new Date(tx.created_at).getTime() <= week.endTime);
      if (txsBefore.length > 0) {
        lastBalance = Number(txsBefore[txsBefore.length - 1].balance_after);
      }
      week.revenue = lastBalance;
    }

    // 3. Monthly wallet balance trend data (Last 6 months)
    const MONTHS = 6;
    const monthly = Array.from({ length: MONTHS }, (_, index) => {
      const monthsAgo = MONTHS - 1 - index;
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        endTime: endOfMonth.getTime(),
        revenue: 0,
        rakSold: 0,
      };
    });

    lastBalance = 0;
    for (const month of monthly) {
      const txsBefore = txs.filter(tx => new Date(tx.created_at).getTime() <= month.endTime);
      if (txsBefore.length > 0) {
        lastBalance = Number(txsBefore[txsBefore.length - 1].balance_after);
      }
      month.revenue = lastBalance;
    }

    const monthlyClean = monthly.map(({ label, revenue, rakSold }) => ({ label, revenue, rakSold }));

    // Populate rak sold counts in daily/weekly/monthly trends for consistency
    for (const order of completedOrders) {
      const orderTime = new Date(order.created_at).getTime();
      
      // Daily
      const daysAgo = Math.floor((now - orderTime) / MS_PER_DAY);
      if (daysAgo >= 0 && daysAgo < DAYS) {
        daily[DAYS - 1 - daysAgo].rakSold += Number(order.rak_quantity);
      }

      // Weekly
      const weeksAgo = Math.floor((now - orderTime) / MS_PER_WEEK);
      if (weeksAgo >= 0 && weeksAgo < WEEKS) {
        weekly[WEEKS - 1 - weeksAgo].rakSold += Number(order.rak_quantity);
      }

      // Monthly
      const orderDate = new Date(order.created_at);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();
      
      const mBucketIndex = monthly.findIndex(
        m => new Date(m.endTime).getFullYear() === orderYear && new Date(m.endTime).getMonth() === orderMonth
      );
      if (mBucketIndex !== -1) {
        monthlyClean[mBucketIndex].rakSold += Number(order.rak_quantity);
      }
    }

    // Sort ratings by date ascending
    const sortedRatings = [...ratingRows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const startOfChartTime = now - WEEKS * MS_PER_WEEK;

    // Calculate initial ratings before the chart timeframe
    let runningSum = 0;
    let runningCount = 0;
    for (const r of sortedRatings) {
      if (new Date(r.created_at).getTime() < startOfChartTime) {
        runningSum += r.rating_value;
        runningCount += 1;
      }
    }

    const ratingTrend = Array.from({ length: WEEKS }, (_, index) => {
      const weeksAgo = WEEKS - 1 - index;
      const weekStartTime = now - (weeksAgo + 1) * MS_PER_WEEK;
      const weekEndTime = now - weeksAgo * MS_PER_WEEK;

      // Add ratings that fall within this week
      for (const r of sortedRatings) {
        const t = new Date(r.created_at).getTime();
        if (t >= weekStartTime && t < weekEndTime) {
          runningSum += r.rating_value;
          runningCount += 1;
        }
      }

      const start = new Date(weekStartTime);
      return {
        label: start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        averageRating: runningCount > 0 ? Number((runningSum / runningCount).toFixed(2)) : null,
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalRakSold,
        stockRak: listing?.stock_rak ?? 0,
        completedOrders: totalCompletedOrders,
        todayRevenue,
        todayRakSold,
        todayCompletedOrders,
        averageRating: Number(averageRating.toFixed(2)),
        deliveryAccuracy,
        finalScore,
      },
      daily: daily.map(({ label, revenue, rakSold }) => ({ label, revenue, rakSold })),
      weekly: weekly.map(({ label, revenue, rakSold }) => ({ label, revenue, rakSold })),
      monthly: monthlyClean,
      ratingTrend,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
