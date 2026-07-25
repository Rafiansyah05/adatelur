const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function setup() {
  const { data, error } = await adminClient.from('peternak_details').select('verification_status').limit(1);
  console.log('Sample rows', data, error);
}

setup();
