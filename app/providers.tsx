'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;

    async function validateProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Check profiles table for existence of this user id.
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          // If error occurs while checking, sign out to be safe
          await supabase.auth.signOut();
          if (mounted) window.location.reload();
          return;
        }

        if (!profile) {
          // No profile row -> likely deleted. Force sign out and reload.
          await supabase.auth.signOut();
          if (mounted) window.location.reload();
        }
      } catch (e) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
    }

    validateProfile();

    // Listen for auth state changes and re-validate when signed in
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        validateProfile();
      }
      if (event === 'SIGNED_OUT') {
        // nothing special
      }
    });

    return () => {
      mounted = false;
      (listener as any)?.subscription?.unsubscribe?.();
    };
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
