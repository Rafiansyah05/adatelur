const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars. Please run with --env-file=.env.local");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: 'admin@gmail.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Super Admin',
      phone_number: '000000000000',
    }
  });

  if (authError) {
    console.error("Error creating auth user:", authError);
  }

  const userId = authData?.user?.id;

  if (userId) {
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: userId,
      role: 'admin',
      full_name: 'Super Admin',
      phone_number: '000000000000',
      email: 'admin@gmail.com'
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    } else {
      console.log("Admin user created successfully!");
    }
  } else {
    console.log("Admin user might already exist. Attempting to upsert role just in case...");
    const { data: users } = await adminClient.auth.admin.listUsers();
    const existing = users.users.find(u => u.email === 'admin@gmail.com');
    if (existing) {
      const { error } = await adminClient.from('profiles').upsert({
        id: existing.id,
        role: 'admin',
        full_name: 'Super Admin',
        phone_number: '000000000000',
        email: 'admin@gmail.com'
      });
      if (error) console.error("Error upserting profile", error);
      else console.log("Admin profile updated.");
    }
  }
}

createAdmin();
