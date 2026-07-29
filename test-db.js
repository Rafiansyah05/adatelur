async function test() {
  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config({ path: '.env.local' });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: rawPeternaks, error } = await supabase
      .from('peternak_details')
      .select(`
        id,
        farm_latitude,
        farm_longitude,
        verification_status,
        profiles!inner (
          id,
          full_name,
          avatar_url
        ),
        listings (
          id,
          price_per_rak,
          stock_rak,
          is_available
        ),
        peternak_scores (
          final_score,
          is_suspended
        )
      `)
      .eq('verification_status', 'approved');
      
  console.log(JSON.stringify({ rawPeternaks, error }, null, 2));
}
test();
