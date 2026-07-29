'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MapPin, Clock, Camera, X, Truck, ShoppingBag, Package, MessageCircle } from 'lucide-react';

const historyStatusLabel: Record<string, string> = {
  completed: 'Selesai',
  rejected: 'Ditolak',
  expired: 'Hangus',
  cancelled: 'Dibatalkan',
};

export default function PeternakOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [peternakId, setPeternakId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date().getTime());
  const [confirmDeliveryOrderId, setConfirmDeliveryOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'masuk' | 'diproses' | 'riwayat'>('masuk');
  const [showAllHistory, setShowAllHistory] = useState(false);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    fetchOrders();

    const timer = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);

    const poll = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, []);

  const fetchOrders = async () => {
    const supabase = supabaseRef.current;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: peternak } = await supabase
        .from('peternak_details')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      
      if (!peternak) return;
      setPeternakId(peternak.id);

      const res = await fetch(`/api/orders/peternak?peternakId=${peternak.id}`, { cache: 'no-store' });
      if (res.ok) {
        const { orders: myOrders } = await res.json();
        setOrders(myOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!peternakId) return;

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`peternak_orders_${peternakId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `peternak_id=eq.${peternakId}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [peternakId]);

  const formatWaNumber = (phone: string) => {
    if (!phone) return '';
    return phone.startsWith('0') ? '62' + phone.slice(1) : phone;
  };

  const handleRespond = async (orderId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/orders/${orderId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Terjadi kesalahan');
        return;
      }
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Terjadi kesalahan saat update status');
        return;
      }
      
      if (status === 'in_delivery') {
        setConfirmDeliveryOrderId(null);
        setToastMessage('Status berhasil diperbarui');
        setTimeout(() => setToastMessage(null), 3000);
      }
      
      fetchOrders();
    } catch (err: any) {
      alert('Gagal update status: ' + err.message);
    }
  };

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const openCamera = async (orderId: string) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', aspectRatio: 4/3 } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setActiveOrderId(orderId);
    } catch (err) {
      alert('Gagal mengakses kamera. Pastikan browser memiliki izin.');
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
    setPhotoPreview(null);
    setActiveOrderId(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoPreview(dataUrl);
        if (stream) stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const retakePhoto = async () => {
    setPhotoPreview(null);
    if (activeOrderId) {
      openCamera(activeOrderId);
    }
  };

  const uploadPhoto = async () => {
    if (!photoPreview || !activeOrderId) return;
    
    setIsUploading(true);
    try {
      const res = await fetch(`/api/orders/${activeOrderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_base64: photoPreview })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Terjadi kesalahan saat mengunggah bukti');
      } else {
        fetchOrders();
        
        const supabase = supabaseRef.current;
        await supabase.rpc('recalculate_peternak_score', { p_peternak_id: peternakId });
        
        alert('Pesanan berhasil diselesaikan');
        closeCamera();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-6 h-7 w-40 animate-pulse rounded-lg bg-neutral-100" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  const incomingOrders = orders.filter(o => o.order_status === 'waiting');
  const activeProcessOrders = orders.filter(o => ['accepted', 'processing', 'in_delivery'].includes(o.order_status));
  const historyOrders = orders.filter(o => ['completed', 'rejected', 'expired', 'cancelled'].includes(o.order_status));
  const visibleHistory = showAllHistory ? historyOrders : historyOrders.slice(0, 10);

  const formatCountdown = (deadlineTime: string) => {
    const end = new Date(deadlineTime).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Habis';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-md h-full md:h-auto md:max-h-[90vh] bg-neutral-900 md:rounded-xl flex flex-col relative overflow-hidden">
            <div className="p-4 flex justify-between items-center text-white z-10 absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent">
              <h3 className="font-bold">Bukti Pengiriman</h3>
              <button onClick={closeCamera} className="p-2 bg-black/40 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-black relative">
              {!photoPreview ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto object-cover max-h-[70vh]"></video>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </>
              ) : (
                <img src={photoPreview} alt="Preview" className="w-full h-auto object-cover max-h-[70vh]" />
              )}
            </div>

            <div className="p-6 bg-neutral-900 pb-10">
              {!photoPreview ? (
                <div className="flex justify-center">
                  <button onClick={capturePhoto} className="h-16 w-16 bg-white rounded-full border-4 border-neutral-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <Camera className="text-black" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button onClick={retakePhoto} variant="secondary" className="flex-1 bg-neutral-700 text-white border-none hover:bg-neutral-600" disabled={isUploading}>Ulangi</Button>
                  <Button onClick={uploadPhoto} variant="primary" className="flex-1 bg-primary-600" disabled={isUploading}>
                    {isUploading ? 'Mengunggah...' : 'Gunakan Foto'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDeliveryOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Apakah Anda yakin<br/>sedang mengantar pesanan ini?</h3>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDeliveryOrderId(null)}>Batal</Button>
              <Button variant="primary" className="flex-1" onClick={() => handleUpdateStatus(confirmDeliveryOrderId, 'in_delivery')}>Ya, Diantar</Button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toastMessage}
        </div>
      )}

      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Kelola Pesanan</h1>

      <div className="mt-6 mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {[
          { key: 'masuk' as const, label: 'Baru Masuk', count: incomingOrders.length },
          { key: 'diproses' as const, label: 'Diproses & Diantar', count: activeProcessOrders.length },
          { key: 'riwayat' as const, label: 'Riwayat', count: historyOrders.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'border-primary-400 text-text-main'
                : 'border-transparent text-text-desc hover:text-text-main'
            }`}
          >
            {tab.label}
            {tab.count > 0 ? ` (${tab.count})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'masuk' && (
      <div className="mb-8">
        {incomingOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-bg-surface py-8 text-center">
            <Package className="h-6 w-6 text-text-muted" />
            <p className="text-sm text-text-desc">Tidak ada pesanan menunggu persetujuan.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {incomingOrders.map(order => {
              const countdown = formatCountdown(order.response_deadline);
              const isExpired = countdown === 'Habis';
              return (
                <Card key={order.id} className="p-5 border border-border border-l-4 border-l-primary-500 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all bg-white">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary-900 overflow-hidden border border-primary-100">
                      {order.consumer?.avatar_url ? (
                        <img 
                          src={order.consumer.avatar_url} 
                          alt={order.consumer?.full_name || 'Pembeli'} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{(order.consumer?.full_name || 'P')[0].toUpperCase()}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-bold text-text-main">Order #{order.id.split('-')[0].toUpperCase()}</span>
                        <span className="flex items-center gap-1 bg-danger-light text-danger-text px-2 py-1 rounded text-xs font-bold animate-pulse">
                          <Clock className="h-3 w-3" />
                          <span>{countdown}</span>
                        </span>
                      </div>
                      <p className="text-sm text-text-desc mb-1">
                        {new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-body-medium text-text-main mb-2">
                        {order.consumer?.full_name || 'Pembeli'} • {order.rak_quantity} Rak
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border ${
                          order.fulfillment_method === 'pickup'
                            ? 'bg-primary-50 text-primary-700 border-primary-200'
                            : 'bg-success-bg text-success-text border border-success'
                        }`}>
                          {order.fulfillment_method === 'pickup'
                            ? <><ShoppingBag className="h-3 w-3" /> Ambil Sendiri</>
                            : <><Truck className="h-3 w-3" /> Diantar</>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 md:pl-6 md:border-l md:border-neutral-100 w-full md:w-auto mt-4 pt-4 border-t border-neutral-100 md:mt-0 md:pt-0 md:border-t-0">
                    <div className="flex flex-col items-end w-full md:w-auto">
                      <span className="text-xs text-text-desc mb-1">Total Pesanan</span>
                      <span className="font-bold text-text-main text-lg">
                        Rp {Number(order.total_amount).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 w-full mt-2">
                      <Button variant="primary" className="w-full font-bold text-sm" onClick={() => handleRespond(order.id, 'accept')} disabled={isExpired}>Terima</Button>
                      <Button variant="secondary" className="w-full text-sm" onClick={() => handleRespond(order.id, 'reject')} disabled={isExpired}>Tolak</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      )}

      {activeTab === 'diproses' && (
      <div className="mb-8">
        {activeProcessOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-bg-surface py-8 text-center">
            <Package className="h-6 w-6 text-text-muted" />
            <p className="text-sm text-text-desc">Tidak ada pesanan aktif saat ini.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeProcessOrders.map(order => (
              <Card key={order.id} onClick={() => router.push(`/dashboard/orders/${order.id}`)} className="p-5 md:p-6 border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:shadow-sm hover:border-primary-200 bg-white cursor-pointer">
                <div className="flex flex-1 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary-900 overflow-hidden border border-primary-100">
                    {order.consumer?.avatar_url ? (
                      <img 
                        src={order.consumer.avatar_url} 
                        alt={order.consumer?.full_name || 'Pembeli'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{(order.consumer?.full_name || 'P')[0].toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-bold text-text-main">Order #{order.id.split('-')[0].toUpperCase()}</span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        order.payment_status === 'paid' ? 'bg-success-bg text-success-text border border-success' : 'bg-primary-100 text-primary-700 border border-primary-200'
                      }`}>
                        {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR'}
                      </span>
                    </div>
                    <p className="text-sm text-text-desc mb-1">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-body-medium text-text-main mb-2">
                      {order.consumer?.full_name || 'Pembeli'} • {order.rak_quantity} Rak
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs font-bold uppercase bg-bg-surface text-text-desc px-2 py-1 rounded border border-border">
                        {order.order_status === 'accepted' ? 'Diproses' : order.order_status === 'in_delivery' ? 'Diantar' : order.order_status}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border ${
                        order.fulfillment_method === 'pickup'
                          ? 'bg-primary-50 text-primary-700 border-primary-200'
                          : 'bg-success-bg text-success-text border border-success'
                      }`}>
                        {order.fulfillment_method === 'pickup'
                          ? <><ShoppingBag className="h-3 w-3" /> Ambil Sendiri</>
                          : <><Truck className="h-3 w-3" /> Diantar</>}
                      </span>
                      {order.delivery_slot && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border bg-primary-50 text-primary-700 border-primary-200">
                          <Clock className="h-3 w-3" />
                          {order.delivery_slot.start_time.substring(0,5)} – {order.delivery_slot.end_time.substring(0,5)} WIB
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 md:pl-6 md:border-l md:border-neutral-100 w-full md:w-auto mt-4 pt-4 border-t border-neutral-100 md:mt-0 md:pt-0 md:border-t-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col items-end w-full md:w-auto">
                    <span className="text-xs text-text-desc mb-1">Total Pesanan</span>
                    <span className="font-bold text-text-main text-lg">
                      Rp {Number(order.total_amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full mt-2">
                    {!['completed', 'rejected', 'cancelled', 'expired'].includes(order.order_status) && order.payment_status === 'paid' && order.consumer?.phone_number && (
                      <Button
                        onClick={() => window.open(`https://wa.me/${formatWaNumber(order.consumer.phone_number)}`, '_blank')}
                        variant="outline"
                        className="w-full text-xs px-3 inline-flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="h-4 w-4 text-success" /> Hubungi WA
                      </Button>
                    )}

                    {order.fulfillment_method === 'delivery' && order.consumer_address && (
                      <Button 
                        variant="outline" 
                        className="w-full text-xs px-3"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${order.consumer_address.latitude},${order.consumer_address.longitude}`, '_blank')}
                      >
                        <MapPin className="h-4 w-4 mr-1" /> Lokasi
                      </Button>
                    )}

                    {['accepted', 'processing'].includes(order.order_status) && order.payment_status === 'paid' && order.fulfillment_method === 'delivery' && (
                      <Button onClick={() => setConfirmDeliveryOrderId(order.id)} variant="primary" className="w-full font-bold text-sm px-5">
                        Kirim Sekarang
                      </Button>
                    )}

                    {order.order_status === 'in_delivery' && (
                      <Button onClick={() => openCamera(order.id)} variant="primary" className="w-full font-bold text-sm px-5">
                        Pesanan Diterima
                      </Button>
                    )}
                    
                    {['accepted', 'processing'].includes(order.order_status) && order.payment_status === 'paid' && order.fulfillment_method === 'pickup' && (
                      <Button onClick={() => openCamera(order.id)} variant="primary" className="w-full font-bold text-sm px-5">
                        Serahkan ke Pembeli
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      )}

      {activeTab === 'riwayat' && (
      <div>
        {historyOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-bg-surface py-8 text-center">
            <Package className="h-6 w-6 text-text-muted" />
            <p className="text-sm text-text-desc">Belum ada riwayat pesanan.</p>
          </div>
        ) : (
          <>
          <div className="flex flex-col gap-3">
            {visibleHistory.map(order => (
              <Card key={order.id} className="p-4 border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-bg-surface">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-base font-bold text-primary-900 overflow-hidden border border-primary-100">
                    {order.consumer?.avatar_url ? (
                      <img 
                        src={order.consumer.avatar_url} 
                        alt={order.consumer?.full_name || 'Pembeli'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{(order.consumer?.full_name || 'P')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-text-main mb-0.5">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-text-desc">{new Date(order.created_at).toLocaleDateString('id-ID')} • {order.consumer?.full_name} • Rp {Number(order.total_amount).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.order_status === 'completed' ? 'bg-success-bg text-success-text border border-success' :
                    'bg-danger-light text-danger-text border border-danger'
                  }`}>
                    {historyStatusLabel[order.order_status] || order.order_status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
          {!showAllHistory && historyOrders.length > 10 && (
            <button
              onClick={() => setShowAllHistory(true)}
              className="mt-3 w-full rounded-lg border border-border bg-white py-3 text-sm font-semibold text-text-main transition-colors hover:bg-bg-surface"
            >
              Lihat Semua ({historyOrders.length})
            </button>
          )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
