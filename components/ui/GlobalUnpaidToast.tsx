'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Clock, X } from 'lucide-react';

export function GlobalUnpaidToast() {
  const [unpaidOrder, setUnpaidOrder] = useState<any | null>(null);
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUnpaidOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('consumer_id', user.id)
        .eq('payment_status', 'unpaid')                         // hanya yang belum dibayar
        .not('order_status', 'in', '("rejected","expired","cancelled","completed","in_delivery")')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setUnpaidOrder(data);

        // Try to read expiry from local storage
        const cachedQris = localStorage.getItem(`qris_data_${data.id}`);
        if (cachedQris) {
          try {
            const parsed = JSON.parse(cachedQris);
            const diff = Math.max(0, Math.floor((parsed.expiry - Date.now()) / 1000));
            setTimeLeft(diff);
          } catch (e) { }
        }
      } else {
        setUnpaidOrder(null);
        setTimeLeft(null);
      }
    };

    fetchUnpaidOrder();

    // Subscribe to realtime updates for instant dismissal
    const channel = supabase.channel('unpaid_toast_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload) => {
          setUnpaidOrder((currentOrder: any) => {
            if (currentOrder && payload.new.id === currentOrder.id) {
              // Dismiss jika sudah dibayar ATAU status sudah tidak perlu dibayar
              const isPaid = payload.new.payment_status === 'paid';
              const isTerminal = ['rejected', 'expired', 'cancelled', 'completed', 'in_delivery'].includes(payload.new.order_status);
              if (isPaid || isTerminal) return null;
            }
            return currentOrder;
          });

          // Re-fetch to sync state
          fetchUnpaidOrder();
        }
      )
      .subscribe();

    // Re-check periodically as a fallback
    const interval = setInterval(fetchUnpaidOrder, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      setUnpaidOrder(null);
      if (unpaidOrder) {
        fetch('/api/payment/expire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: unpaidOrder.id })
        });
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, unpaidOrder]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!unpaidOrder || unpaidOrder.id === dismissedOrderId) return null;

  return (
    <div
      onClick={() => router.push(`/checkout/${unpaidOrder.id}`)}
      className="fixed bottom-6 max-md:bottom-[80px] right-6 max-md:right-4 z-[150] bg-white rounded-lg shadow-lg border border-primary-200 p-4 cursor-pointer hover:shadow-xl transition-all animate-in slide-in-from-bottom-5 max-w-sm flex items-center gap-4 pr-10"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDismissedOrderId(unpaidOrder.id);
        }}
        className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 p-1 rounded-md hover:bg-neutral-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex-shrink-0 bg-primary-50 p-3 rounded-full">
        <Clock className="w-6 h-6 text-primary-600 animate-pulse" />
      </div>
      <div>
        <h4 className="font-bold text-text-main text-sm">Selesaikan Pembayaran!</h4>
        <p className="text-xs text-neutral-500 mt-0.5">
          Order #{unpaidOrder.id.split('-')[0].toUpperCase()} menunggu pembayaran.
        </p>
        {timeLeft !== null && (
          <div className="mt-1 text-xs font-bold text-danger">
            Sisa Waktu: {formatTime(timeLeft)}
          </div>
        )}
      </div>
    </div>
  );
}
