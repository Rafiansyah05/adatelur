import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminClient = createClient(supabaseUrl, supabaseKey);

async function test() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  try {
    const { data: ordersToday, error } = await adminClient
      .from('orders')
      .select('rak_quantity')
      .gte('created_at', todayStart.toISOString())
      .not('status', 'in', '("rejected","cancelled")');
    console.log('Orders:', ordersToday);
    console.log('Error:', error);
  } catch (e) {
    console.error('Exception:', e);
  }
}
test();
