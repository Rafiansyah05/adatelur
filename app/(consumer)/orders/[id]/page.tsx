'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, peternak:peternak_details(profile:profiles(full_name))')
        .eq('id', params.id)
        .single();
        
      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: historyData, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', params.id)
        .order('created_at', { ascending: true });
        
      if (historyError) throw historyError;
      setHistory(historyData || []);

      if (orderData.order_status === 'completed') {
        const { data: ratingData } = await supabase
          .from('ratings')
          .select('*')
          .eq('order_id', params.id)
          .single();
        if (ratingData) {
          setExistingRating(ratingData);
          setRating(ratingData.rating_value);
          setReview(ratingData.review_text || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Subscribe to order changes
    const orderSubscription = supabase
      .channel(`order_${params.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${params.id}` },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
          // Refresh history when order updates
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [params.id]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert('Silakan pilih bintang');
    setIsRatingSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${params.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating_value: rating, review_text: review })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Terjadi kesalahan');
      }
      alert('Terima kasih atas ulasan Anda!');
      fetchOrder(); // refresh rating state
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent"></div>
          <p className="text-body text-text-desc">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-white p-12 text-center shadow-sm">
        <AlertCircle className="h-16 w-16 text-danger" />
        <h2 className="text-h2 text-text-main">Pesanan Tidak Ditemukan</h2>
        <p className="text-body text-text-desc max-w-md">
          Pesanan yang Anda cari tidak ada atau Anda tidak memiliki akses.
        </p>
        <Button onClick={() => router.push('/')} variant="primary" className="mt-4">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  const isRejected = order.order_status === 'rejected';
  const isExpired = order.order_status === 'expired';
  const isFailed = isRejected || isExpired;

  const steps = [
    { key: 'waiting', label: 'Menunggu Konfirmasi' },
    { key: 'accepted', label: 'Pesanan Diterima' },
    { key: order.fulfillment_method === 'delivery' ? 'delivering' : 'ready_for_pickup', label: order.fulfillment_method === 'delivery' ? 'Sedang Diantar' : 'Siap Diambil' },
    { key: 'completed', label: 'Selesai' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.order_status);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-body text-text-desc mb-1">ID Pesanan: {order.id.split('-')[0].toUpperCase()}</p>
          <h1 className="text-display text-text-main">Status Pesanan</h1>
        </div>
        
        {isFailed ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-danger bg-danger-light px-4 py-2 text-sm font-semibold text-danger-text">
            <XCircle className="h-4 w-4" />
            {isRejected ? 'Ditolak oleh Peternak' : 'Waktu Habis (Expired)'}
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-950">
            <Clock className="h-4 w-4 text-primary-600" />
            {steps.find(s => s.key === order.order_status)?.label || 'Memproses...'}
          </div>
        )}
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-h3 text-text-main mb-6">Lacak Pesanan</h2>
        
        {isFailed ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <XCircle className="h-16 w-16 text-danger" />
            <div>
              <h3 className="text-h2 text-text-main mb-2">
                {isRejected ? 'Pesanan Ditolak' : 'Pesanan Kadaluarsa'}
              </h3>
              <p className="text-body text-text-desc max-w-md mx-auto">
                {isRejected 
                  ? 'Maaf, peternak tidak dapat memproses pesanan Anda saat ini. Silakan cari peternak lain.'
                  : 'Pesanan Anda dibatalkan otomatis karena peternak tidak merespon dalam batas waktu (5 menit).'}
              </p>
            </div>
            <Button onClick={() => router.push('/')} variant="primary" className="mt-4">
              Lihat Rekomendasi Lain
            </Button>
          </div>
        ) : (
          <div className="relative pl-6">
            {/* Connecting line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border" />
            
            <div className="flex flex-col gap-8">
              {steps.map((step, index) => {
                const isCompleted = currentStepIndex >= index;
                const isCurrent = currentStepIndex === index;
                
                return (
                  <div key={step.key} className="relative flex items-start gap-4">
                    {/* Icon indicator */}
                    <div className="absolute -left-6 z-10 flex h-6 w-6 items-center justify-center bg-white">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <Circle className="h-6 w-6 text-border" />
                      )}
                    </div>
                    
                    <div className="pt-0.5">
                      <p className={`text-h3 ${isCompleted ? 'text-text-main' : 'text-text-muted'}`}>
                        {step.label}
                      </p>
                      {isCurrent && order.order_status === 'waiting' && (
                        <p className="text-body text-text-desc mt-1">
                          Menunggu konfirmasi dari peternak (maks 5 menit).
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.order_status === 'completed' && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-h3 text-text-main mb-4">Nilai Peternak</h3>
            {existingRating ? (
              <div className="rounded-lg bg-primary-50 p-4 border border-primary-100">
                <p className="font-bold text-text-main mb-2">Penilaian Anda:</p>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-6 h-6 ${star <= existingRating.rating_value ? 'text-primary-500' : 'text-neutral-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {existingRating.review_text && (
                  <p className="text-text-desc text-sm italic">"{existingRating.review_text}"</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                      <svg className={`w-8 h-8 ${star <= rating ? 'text-primary-500' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <textarea 
                  placeholder="Tulis ulasan (opsional)" 
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full rounded-md border border-border p-3 text-sm focus:border-primary-500 focus:outline-none"
                  rows={3}
                />
                <Button type="submit" disabled={isRatingSubmitting} className="w-full">
                  {isRatingSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
                </Button>
              </form>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-h3 text-text-main mb-4">Rincian Pembayaran</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-body">
            <span className="text-text-desc">Peternak</span>
            <span className="font-medium">{order.peternak?.profile?.full_name || 'Peternak'}</span>
          </div>
          <div className="flex justify-between items-center text-body">
            <span className="text-text-desc">Jumlah Pesanan</span>
            <span className="font-medium">{order.rak_quantity} Rak</span>
          </div>
          <div className="flex justify-between items-center text-body">
            <span className="text-text-desc">Harga per rak</span>
            <span className="font-medium">Rp {Number(order.price_per_rak).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between items-center text-body">
            <span className="text-text-desc">Metode</span>
            <span className="font-medium">{order.fulfillment_method === 'pickup' ? 'Ambil Sendiri' : 'Diantar'}</span>
          </div>
          <div className="flex justify-between items-center text-body">
            <span className="text-text-desc">Ongkos Kirim</span>
            <span className="font-medium">Rp {Number(order.ongkir_amount).toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <div className="my-4 h-[1px] w-full bg-border" />
        
        <div className="flex justify-between items-center">
          <span className="text-body-medium text-text-main">Total Dibayar</span>
          <span className="text-h2 text-text-main">
            Rp {Number(order.total_amount).toLocaleString('id-ID')}
          </span>
        </div>
      </Card>
    </div>
  );
}
