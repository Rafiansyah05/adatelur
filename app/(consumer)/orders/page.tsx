'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RatingModal } from '@/components/ui/RatingModal';
import Link from 'next/link';
import { Package, PackageX, X, Clock, MapPin, Truck, ShoppingBag, MessageCircle } from 'lucide-react';
import Image from 'next/image';

export default function ConsumerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat'>('aktif');
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [proofData, setProofData] = useState<any | null>(null);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders/consumer', { cache: 'no-store' });
        if (!res.ok) throw new Error('Gagal memuat pesanan');
        const { orders: myOrders } = await res.json();
        setOrders(myOrders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('orders_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async () => {
          // Re-fetch all orders via admin API to get full joins
          try {
            const res = await fetch('/api/orders/consumer', { cache: 'no-store' });
            if (!res.ok) return;
            const { orders: myOrders } = await res.json();
            setOrders(myOrders || []);
            // Sync tracking modal if open
            setTrackingOrder((prev: any) => {
              if (!prev) return null;
              return myOrders?.find((o: any) => o.id === prev.id) || prev;
            });
          } catch (e) {
            console.error(e);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => !['completed', 'rejected', 'cancelled', 'expired'].includes(o.order_status));
  const historyOrders = orders.filter(o => ['completed', 'rejected', 'cancelled', 'expired'].includes(o.order_status));
  
  const displayedOrders = activeTab === 'aktif' ? activeOrders : historyOrders;

  const formatTime = (timeString: string) => timeString.substring(0, 5);
  
  const formatWaNumber = (phone: string) => {
    if (!phone) return '';
    return phone.startsWith('0') ? '62' + phone.slice(1) : phone;
  };

  return (
    <div className="mx-auto w-full max-w-4xl pb-4 md:pb-8 relative">
      <div className="sticky top-14 md:top-[72px] z-30 mb-6 -mx-4 md:mx-0 flex w-full border-b border-border bg-white shadow-sm md:shadow-none">
        <button 
          onClick={() => setActiveTab('aktif')}
          className={`flex-1 border-b-2 py-3 text-sm font-bold transition-colors text-center ${
            activeTab === 'aktif' 
              ? 'border-primary-500 text-primary-700' 
              : 'border-transparent text-text-desc hover:text-text-main'
          }`}
        >
          Berlangsung
        </button>
        <button 
          onClick={() => setActiveTab('riwayat')}
          className={`flex-1 border-b-2 py-3 text-sm font-bold transition-colors text-center ${
            activeTab === 'riwayat' 
              ? 'border-primary-500 text-primary-700' 
              : 'border-transparent text-text-desc hover:text-text-main'
          }`}
        >
          Riwayat
        </button>
      </div>
      
      {displayedOrders.length === 0 ? (
        <Card className="p-12 text-center border border-border bg-bg-surface flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 text-neutral-300">
            {activeTab === 'aktif' ? <Package className="h-8 w-8" /> : <PackageX className="h-8 w-8" />}
          </div>
          <h3 className="text-h3 text-text-main mb-2">
            {activeTab === 'aktif' ? 'Belum Ada Pesanan Aktif' : 'Belum Ada Riwayat'}
          </h3>
          <p className="text-body text-text-desc mb-6 max-w-sm">
            {activeTab === 'aktif' 
              ? 'Anda tidak memiliki pesanan yang sedang diproses. Yuk belanja telur segar sekarang!' 
              : 'Anda belum pernah menyelesaikan pesanan apapun sebelumnya.'}
          </p>
          <Link href="/">
            <Button variant="primary">Pesan Telur Sekarang</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {displayedOrders.map((order) => (
            <Card key={order.id} className="p-5 md:p-6 border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:shadow-sm hover:border-primary-200 bg-white">
              <div className="flex flex-1 items-start gap-4">
                {/* Peternak Logo */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-bold text-primary-900 overflow-hidden border border-primary-100">
                  {order.peternak?.profile?.avatar_url ? (
                    <img 
                      src={order.peternak.profile.avatar_url} 
                      alt={order.peternak?.profile?.full_name || 'Peternak'} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{(order.peternak?.profile?.full_name || 'P')[0].toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="font-bold text-text-main">Order #{order.id.split('-')[0].toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      order.order_status === 'completed' ? 'bg-success-bg text-success-text border border-success' : 
                      (order.order_status === 'rejected' || order.order_status === 'expired') ? 'bg-danger-light text-danger-text border border-danger' :
                      'bg-primary-100 text-primary-900 border border-primary-200'
                    }`}>
                      {order.order_status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-text-desc mb-1">
                    {new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-body-medium text-text-main mb-2">
                    {order.peternak?.profile?.full_name || 'Peternak'} • {order.rak_quantity} Rak
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
                  
                  {order.delivery_slot && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border bg-primary-50 text-primary-700 border-primary-200">
                      <Clock className="h-3 w-3" />
                      {formatTime(order.delivery_slot.start_time)} – {formatTime(order.delivery_slot.end_time)} WIB
                    </span>
                  )}
                  </div>
                </div>
              </div>
            
            {/* Kolom kanan: harga + tombol aksi */}
            <div className="flex flex-col items-end gap-3 md:pl-6 md:border-l md:border-neutral-100 w-full md:w-auto mt-4 pt-4 border-t border-neutral-100 md:mt-0 md:pt-0 md:border-t-0">
              <div className="flex flex-col items-end">
                <span className="text-xs text-text-desc mb-1">Total Belanja</span>
                <span className="font-bold text-text-main text-lg">
                  Rp {Number(order.total_amount).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                {/* Hubungi WA */}
                {!['completed', 'rejected', 'cancelled', 'expired'].includes(order.order_status) && order.peternak?.profile?.phone_number && (
                  <Button
                    onClick={() => window.open(`https://wa.me/${formatWaNumber(order.peternak.profile.phone_number)}`, '_blank')}
                    variant="outline"
                    className="inline-flex items-center justify-center gap-2 font-bold text-sm flex-1 md:flex-none px-4"
                  >
                    <MessageCircle className="h-4 w-4 text-green-600" /> Hubungi WA
                  </Button>
                )}
                
                {/* Beri Rating (hanya completed dan belum di-rate) */}
                {order.order_status === 'completed' && order.rating === null && (
                  <Button
                    onClick={() => setRatingOrderId(order.id)}
                    variant="outline"
                    className="font-bold text-sm flex-1 md:flex-none px-4 border-primary-500 text-primary-700"
                  >
                    Beri Rating
                  </Button>
                )}

                {/* Delivery: Lacak Pesanan / Lihat Bukti */}
                {order.fulfillment_method === 'delivery' && (
                  <Button 
                    onClick={() => {
                      if (order.order_status === 'completed' && order.delivery_proof?.photo_url) {
                        setProofData(order.delivery_proof);
                      } else {
                        setTrackingOrder(order);
                      }
                    }} 
                    variant="primary" 
                    className="font-bold text-sm flex-1 md:flex-none px-4"
                  >
                    {order.order_status === 'completed' ? 'Lihat Bukti' : 'Lacak Pesanan'}
                  </Button>
                )}

                {/* Pickup: Lihat Bukti (selesai) / Lokasi Peternak (aktif) */}
                {order.fulfillment_method === 'pickup' && (
                    order.order_status === 'completed' && order.delivery_proof?.photo_url ? (
                      <Button
                        onClick={() => setProofData(order.delivery_proof)}
                        variant="primary"
                        className="font-bold text-sm flex-1 md:flex-none px-4"
                      >
                      Lihat Bukti
                    </Button>
                  ) : order.peternak?.farm_latitude && order.peternak?.farm_longitude ? (
                    <Button
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${order.peternak.farm_latitude},${order.peternak.farm_longitude}`, '_blank')}
                      variant="primary"
                      className="inline-flex items-center justify-center gap-2 font-bold text-sm flex-1 md:flex-none px-4"
                    >
                      <MapPin className="h-4 w-4" /> Lokasi Peternak
                    </Button>
                  ) : null
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    )}

      {/* Tracking Modal/Sidebar */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 md:justify-end">
          {/* Backdrop to close */}
          <div className="absolute inset-0 md:hidden" onClick={() => setTrackingOrder(null)}></div>
          
          <div className="relative bg-white w-[90%] max-h-[80vh] md:w-[420px] md:h-full md:max-h-none rounded-xl md:rounded-none overflow-y-auto p-6 shadow-xl animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setTrackingOrder(null)}
              className="absolute top-4 right-4 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-text-main"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold mb-6 text-text-main">
              {trackingOrder.order_status === 'completed' ? 'Bukti Pengiriman' : 'Lacak Pesanan'}
            </h2>
            
            <div className="mb-8">
              <p className="text-sm text-text-desc">ID Pesanan</p>
              <p className="font-bold">{trackingOrder.id}</p>
            </div>

            <div className="relative border-l-2 border-neutral-200 ml-3 space-y-8">
              {/* Diproses */}
              <div className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-white transition-colors duration-300 ${
                  ['accepted', 'processing', 'in_delivery', 'completed'].includes(trackingOrder.order_status) 
                    ? 'border-primary-500 bg-primary-500' 
                    : 'border-neutral-300'
                }`}></div>
                <h4 className={`font-bold transition-colors duration-300 ${
                  ['accepted', 'processing', 'in_delivery', 'completed'].includes(trackingOrder.order_status) ? 'text-primary-600' : 'text-neutral-400'
                }`}>Diproses</h4>
                <p className="text-sm text-neutral-500">Pesanan sedang disiapkan peternak</p>
              </div>

              {/* Diantar */}
              <div className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-white transition-colors duration-300 ${
                  ['in_delivery', 'completed'].includes(trackingOrder.order_status)
                    ? 'border-primary-500 bg-primary-500' 
                    : 'border-neutral-300'
                }`}></div>
                <h4 className={`font-bold transition-colors duration-300 ${
                  ['in_delivery', 'completed'].includes(trackingOrder.order_status) ? 'text-primary-600' : 'text-neutral-400'
                }`}>Diantar</h4>
                <p className="text-sm text-neutral-500">Pesanan dalam perjalanan ke lokasi Anda</p>
              </div>

              {/* Diterima */}
              <div className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-white transition-colors duration-300 ${
                  trackingOrder.order_status === 'completed'
                    ? 'border-primary-500 bg-primary-500' 
                    : 'border-neutral-300'
                }`}></div>
                <h4 className={`font-bold transition-colors duration-300 ${
                  trackingOrder.order_status === 'completed' ? 'text-primary-600' : 'text-neutral-400'
                }`}>Diterima</h4>
                <p className="text-sm text-neutral-500">Pesanan telah sampai</p>
              </div>
            </div>

            {trackingOrder.order_status === 'completed' && trackingOrder.delivery_proof?.photo_url && (
              <div className="mt-8 border-t border-neutral-200 pt-6">
                <h3 className="font-bold text-lg mb-4">Bukti Pengiriman</h3>
                <div className="bg-neutral-100 rounded-lg overflow-hidden relative h-48 w-full border border-neutral-200">
                  <Image 
                    src={trackingOrder.delivery_proof.photo_url}
                    alt="Bukti Pengiriman"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-2 text-center">
                  Tanggal: {new Date(trackingOrder.delivery_proof.captured_at).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof Photo Modal */}
      {proofData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <button 
            onClick={() => setProofData(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="relative w-full max-w-2xl bg-white rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative w-full aspect-square md:aspect-video bg-black">
              <Image 
                src={proofData.photo_url}
                alt="Bukti Pengiriman"
                fill
                className="object-contain"
              />
            </div>
            {(proofData.latitude || proofData.captured_at) && (
              <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {proofData.captured_at && (
                  <div className="flex items-center gap-2 text-sm text-text-main">
                    <Clock className="h-4 w-4 text-primary-600" />
                    <span className="font-medium">{new Date(proofData.captured_at).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {proofData.latitude && proofData.longitude && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${proofData.latitude},${proofData.longitude}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-bold"
                  >
                    <MapPin className="h-4 w-4" /> Lihat Titik Lokasi
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RATING MODAL */}
      <RatingModal
        isOpen={!!ratingOrderId}
        onClose={() => setRatingOrderId(null)}
        orderId={ratingOrderId!}
        onSuccess={() => {
          // Trigger order refresh after rating
          setOrders(prev => prev.map(o => 
            o.id === ratingOrderId ? { ...o, rating: 5 } : o // optimistic update, real value fetched next reload
          ));
        }}
      />
    </div>
  );
}
