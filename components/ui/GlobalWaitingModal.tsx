'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export function GlobalWaitingModal() {
  const [waitingOrder, setWaitingOrder] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchWaitingOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('orders')
        .select('*, peternak:peternak_details(profile:profiles(full_name))')
        .eq('consumer_id', user.id)
        .eq('order_status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const deadline = new Date(data.response_deadline).getTime();
        const now = new Date().getTime();
        if (deadline > now) {
          setWaitingOrder(data);
        } else {

          fetch(`/api/orders/${data.id}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'cancel' })
          }).catch(() => { });
        }
      }
    };
    fetchWaitingOrder();

    const handleNewOrder = () => fetchWaitingOrder();
    window.addEventListener('new-order-created', handleNewOrder);
    return () => window.removeEventListener('new-order-created', handleNewOrder);
  }, []);

  useEffect(() => {
    if (!waitingOrder) return;

    const interval = setInterval(() => {
      const deadline = new Date(waitingOrder.response_deadline).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        setWaitingOrder(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [waitingOrder]);

  useEffect(() => {
    if (!waitingOrder) return;

    const channel = supabase
      .channel(`global_order_status_${waitingOrder.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${waitingOrder.id}`
      }, (payload) => {
        const newStatus = payload.new.order_status;
        if (newStatus === 'accepted') {
          router.push(`/checkout/${waitingOrder.id}`);
          setWaitingOrder(null);
        } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
          setWaitingOrder({ ...waitingOrder, order_status: 'cancelled' });
          setTimeout(() => setWaitingOrder(null), 4000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [waitingOrder, router, supabase]);

  const handleCancel = async () => {
    if (waitingOrder) {
      await fetch(`/api/orders/${waitingOrder.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
      setWaitingOrder(null);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!waitingOrder) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-6 relative text-center">
        {waitingOrder.order_status === 'cancelled' ? (
          <div className="py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">Pesanan Dibatalkan</h2>
            <p className="text-sm text-neutral-500">
              Pesanan telah dibatalkan atau ditolak.
            </p>
          </div>
        ) : (
          <div className="py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 mb-4 animate-pulse">
              <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">Menunggu Konfirmasi</h2>
            <p className="text-sm text-neutral-500 px-4 mb-6 leading-relaxed">
              Mohon tunggu sebentar, kami sedang meneruskan pesanan Anda ke {waitingOrder.peternak?.profile?.full_name || 'Peternak'}. Jika dalam 3 menit tidak ada konfirmasi, pesanan akan dibatalkan otomatis.
            </p>
            <button
              onClick={handleCancel}
              className="py-2.5 px-6 text-sm font-semibold text-danger bg-danger/10 hover:bg-danger/20 rounded-lg transition-colors"
            >
              Batalkan Pesanan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
