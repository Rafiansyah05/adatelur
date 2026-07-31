const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zberoocaxyxuynqaaupf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZXJvb2NheHl4dXlucWFhdXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYzMzk2NSwiZXhwIjoyMTAwMjA5OTY1fQ.bEtlnq77815LJZZ1hwtBD6bfdtBLTB2xHbfzgH66JvY'
);

async function test() {
  const peternakId = 'f450e406-ef67-4f21-a0a5-b55be095bca1';

  const [{ data: score }, { data: listing }, { data: wallet }, { data: transactions }] = await Promise.all([
    supabase
      .from('peternak_scores')
      .select('delivery_accuracy_pct, final_score, average_rating')
      .eq('peternak_id', peternakId)
      .maybeSingle(),
    supabase
      .from('listings')
      .select('stock_rak')
      .eq('peternak_id', peternakId)
      .maybeSingle(),
    supabase
      .from('wallets')
      .select('balance')
      .eq('peternak_id', peternakId)
      .maybeSingle(),
    supabase
      .from('wallet_transactions')
      .select('amount, type, balance_after, created_at')
      .eq('peternak_id', peternakId)
      .order('created_at', { ascending: true }),
  ]);

  const txs = transactions ?? [];
  const WEEKS = 12;
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

  const now = Date.now();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfTodayTime = endOfToday.getTime();

  const DAYS = 10;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daily = Array.from({ length: DAYS }, (_, index) => {
    const daysAgo = DAYS - 1 - index;
    const bucketEnd = new Date(endOfTodayTime - daysAgo * MS_PER_DAY);
    return {
      label: bucketEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      endTime: bucketEnd.getTime(),
      revenue: 0,
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

  console.log('Daily Trend:', daily);
}

test();
