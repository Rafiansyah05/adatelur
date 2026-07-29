const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://zberoocaxyxuynqaaupf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZXJvb2NheHl4dXlucWFhdXBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDYzMzk2NSwiZXhwIjoyMTAwMjA5OTY1fQ.bEtlnq77815LJZZ1hwtBD6bfdtBLTB2xHbfzgH66JvY'
);

async function test() {
  const { data: rawPeternaks } = await supabase
    .from('peternak_details')
    .select(`
      id,
      profiles!inner (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('verification_status', 'approved')
    .limit(1);

  console.log(rawPeternaks);
}

test();
