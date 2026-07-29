const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zberoocaxyxuynqaaupf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZXJvb2NheHl4dXlucWFhdXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYzMzk2NSwiZXhwIjoyMTAwMjA5OTY1fQ.bEtlnq77815LJZZ1hwtBD6bfdtBLTB2xHbfzgH66JvY'
);

async function test() {
  const peternakId = 'f450e406-ef67-4f21-a0a5-b55be095bca1'; // Aramsamam
  
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('peternak_id', peternakId)
    .maybeSingle();

  const { data: txs } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('peternak_id', peternakId);

  console.log({ wallet, txs });
}

test();
