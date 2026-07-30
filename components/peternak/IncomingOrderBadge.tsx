'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

export function IncomingOrderBadge() {
  const [count, setCount] = useState(0);
  const [peternakId, setPeternakId] = useState<string | null>(null);
  const supabase = createClient();
  const pathname = usePathname();

  // Reset count and update last_seen when on orders page
  useEffect(() => {
    if (pathname === '/dashboard/orders') {
      localStorage.setItem('peternak_last_seen_orders', new Date().toISOString());
      setCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    async function fetchUserAndCount() {
      if (pathname === '/dashboard/orders') return; // Don't fetch if we're on the page

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: peternak } = await supabase
        .from('peternak_details')
        .select('id')
        .eq('profile_id', user.id)
        .single();
        
      if (!peternak) return;
      setPeternakId(peternak.id);

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('peternak_id', peternak.id)
        .eq('order_status', 'waiting')
        .gt('response_deadline', new Date().toISOString());

      const lastSeenStr = localStorage.getItem('peternak_last_seen_orders');
      if (lastSeenStr) {
        query = query.gt('created_at', lastSeenStr);
      }

      const { count: initialCount } = await query;
      setCount(initialCount || 0);
    }

    fetchUserAndCount();
  }, [supabase, pathname]);

  useEffect(() => {
    if (!peternakId) return;

    const channelName = `incoming_orders_badge_${peternakId}_${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `peternak_id=eq.${peternakId}`
        },
        async () => {
          if (pathname === '/dashboard/orders') return; // Ignore updates if on page
          
          let query = supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('peternak_id', peternakId)
            .eq('order_status', 'waiting')
            .gt('response_deadline', new Date().toISOString());

          const lastSeenStr = localStorage.getItem('peternak_last_seen_orders');
          if (lastSeenStr) {
            query = query.gt('created_at', lastSeenStr);
          }

          const { count: updatedCount } = await query;
          setCount(updatedCount || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, peternakId, pathname]);

  if (count === 0 || pathname === '/dashboard/orders') return null;

  return (
    <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-400 px-1 text-[9px] font-bold text-neutral-900 border border-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
