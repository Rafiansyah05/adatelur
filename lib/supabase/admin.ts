import { createClient } from '@supabase/supabase-js';

/**
 * Admin client menggunakan service_role key — bypass RLS.
 * HANYA digunakan di server-side (API routes / Server Actions).
 * Jangan pernah expose ke client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase URL atau Service Role Key belum dikonfigurasi di .env.local');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
