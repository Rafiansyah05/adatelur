'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/toast';

interface DeliverySlot {
  id: string;
  slot_date?: string;
  start_time: string;
  end_time: string;
}

interface PeternakData {
  full_name?: string;
  farm_name?: string;
  rating?: string;
  score?: number;
  price_per_rak?: number;
  delivery_slots?: DeliverySlot[];
  farm_latitude?: number;
  farm_longitude?: number;
  listing_id?: string;
  stock_rak?: number;
  sold_rak_today?: number;
  has_vehicle?: boolean;
}

export default function PeternakDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<PeternakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [consumerAddress, setConsumerAddress] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`/api/peternak/${params.id}`).then((r) => r.json()),
      fetch('/api/consumer/address')
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([petRes, addrRes]) => {
        if (!mounted) return;
        setData(petRes.data || null);
        if (petRes.data?.has_vehicle === false) {
          setMethod('pickup');
        }
        setConsumerAddress(addrRes?.address || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading)
    return <div className="p-8 text-center text-text-desc">Memuat detail peternak...</div>;
  if (!data) return <div className="p-8 text-center text-text-desc">Peternak tidak ditemukan.</div>;

  const availableStock = data ? Math.max(0, (data.stock_rak || 0) - (data.sold_rak_today || 0)) : 0;
  const parsedQuantity = typeof quantity === 'number' ? quantity : 0;
  const isOverStock = parsedQuantity > availableStock;

  const displayName = data.farm_name || data.full_name || 'Peternak Ada Telur';

  const computeOngkir = () => {
    if (method === 'pickup' || !consumerAddress || !data.farm_latitude || !data.farm_longitude)
      return 0;
    const d = haversineDistance(
      data.farm_latitude,
      data.farm_longitude,
      Number(consumerAddress.latitude),
      Number(consumerAddress.longitude)
    );
    return calculateOngkir(d);
  };

  const handlePesan = async () => {
    if (!selectedSlot) {
      showToast('Pilih slot waktu terlebih dahulu', 'error');
      return;
    }

    if (method === 'delivery' && !consumerAddress) {
      showToast('Anda belum mengatur alamat pengiriman. Anda akan dialihkan ke halaman profil.', 'error');
      router.push('/profile');
      return;
    }

    setShowSummary(true);
    try {
      sessionStorage.setItem('last_recommend_params', JSON.stringify({ quantity, method }));
    } catch {}
  };

  const handleConfirmOrder = async () => {
    if (!data.listing_id) {
      showToast('Listing tidak ditemukan', 'error');
      return;
    }
    const payload: any = {
      listing_id: data.listing_id,
      rak_quantity: quantity,
      fulfillment_method: method,
      delivery_slot_id: selectedSlot,
    };
    if (method === 'delivery' && consumerAddress) payload.consumer_address_id = consumerAddress.id;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(json.error || 'Gagal membuat pesanan', 'error');
      return;
    }
    setShowSummary(false);
    router.push(`/orders/${json.order.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 overflow-hidden rounded-xl bg-white shadow-sm border border-border">
        <div className="bg-primary-50 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-[24px] font-bold text-primary-950">
              {displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-h1 text-text-main mb-1">{displayName}</h1>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-body-medium text-text-main">
                  ⭐ {data.rating || '4.8'}
                </span>
                <span className="text-border">•</span>
                <span className="inline-flex items-center rounded-sm bg-primary-400 px-2 py-0.5 text-caption font-bold text-primary-950">
                  Score {data.score || 85}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-h3 text-text-main mb-3">Detail Pesanan</h2>
              <div className="rounded-lg border border-border bg-bg-surface p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-body text-text-desc">Harga per rak</span>
                  <span className="text-h3 text-text-main">
                    Rp {data.price_per_rak ? Number(data.price_per_rak).toLocaleString('id-ID') : '0'}
                  </span>
                </div>

                <div className="mb-4 h-[1px] w-full bg-border" />

                <div className="mb-4">
                  <label className="text-body-medium text-text-main block mb-2">Jumlah rak</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, parsedQuantity - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-main hover:bg-bg-surface disabled:opacity-50"
                      disabled={parsedQuantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setQuantity('');
                        } else {
                          const num = parseInt(val);
                          if (!isNaN(num) && num >= 1) {
                            setQuantity(num);
                          }
                        }
                      }}
                      className={`w-20 h-10 text-center text-h3 rounded-md border ${isOverStock ? 'border-danger text-danger bg-red-50 focus:ring-danger' : 'border-border'} focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    />
                    <button
                      onClick={() => setQuantity(parsedQuantity + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-main hover:bg-bg-surface"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-border mb-4" />

                <div>
                  <label className="text-body-medium text-text-main block mb-2">Metode Pengambilan</label>
                  <div className="flex gap-4">
                    <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm font-bold transition-colors ${method === 'pickup' ? 'border-primary-400 bg-primary-50 text-primary-950' : 'border-border bg-white text-text-main'}`}>
                      <input type="radio" name="method" checked={method === 'pickup'} onChange={() => setMethod('pickup')} className="hidden" />
                      Ambil Sendiri
                    </label>
                    {data.has_vehicle !== false && (
                      <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm font-bold transition-colors ${method === 'delivery' ? 'border-primary-400 bg-primary-50 text-primary-950' : 'border-border bg-white text-text-main'}`}>
                        <input type="radio" name="method" checked={method === 'delivery'} onChange={() => setMethod('delivery')} className="hidden" />
                        Diantar
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-h3 text-text-main mb-3">Pilih Slot Waktu</h2>
              {data.delivery_slots && data.delivery_slots.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.delivery_slots.map((slot: DeliverySlot) => {
                    const startTimeStr = slot.start_time.substring(0, 5);
                    const endTimeStr = slot.end_time.substring(0, 5);
                    const isSelected = selectedSlot === slot.id;

                    return (
                      <label
                        key={slot.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 transition-colors ${isSelected ? 'border-primary-400 bg-primary-50' : 'border-border bg-white hover:border-primary-300'}`}
                      >
                        <input
                          type="radio"
                          name="slot"
                          value={slot.id}
                          checked={isSelected}
                          onChange={() => setSelectedSlot(slot.id)}
                          className="accent-primary-500 h-4 w-4"
                        />
                        <div>
                          <p className={`text-body-medium ${isSelected ? 'text-primary-950' : 'text-text-main'}`}>
                            {startTimeStr} - {endTimeStr}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-md border border-border bg-bg-surface p-6 text-center">
                  <p className="text-body text-text-desc">Belum ada slot waktu tersedia hari ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-caption text-text-desc">Total Pembayaran</p>
              <p className="text-h2 text-text-main">
                Rp {((Number(data.price_per_rak || 0) * parsedQuantity) + computeOngkir()).toLocaleString('id-ID')}
              </p>
            </div>
            <Button onClick={handlePesan} variant="primary" className="px-8 h-[48px]">
              Lanjutkan
            </Button>
          </div>
        </div>
      </div>

      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-text-main/40 backdrop-blur-sm transition-opacity" onClick={() => setShowSummary(false)} />
          <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-h2 text-text-main mb-6 text-center">Ringkasan Pesanan</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-body">
                <span className="text-text-desc">Harga per rak</span>
                <span className="font-medium">Rp {Number(data.price_per_rak || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-body">
                <span className="text-text-desc">Jumlah pesanan</span>
                <span className="font-medium">{quantity} Rak</span>
              </div>
              <div className="flex justify-between items-center text-body">
                <span className="text-text-desc">Metode</span>
                <span className="font-medium">{method === 'pickup' ? 'Ambil Sendiri' : 'Diantar (Delivery)'}</span>
              </div>
              {method === 'delivery' && (
                <div className="flex justify-between items-center text-body">
                  <span className="text-text-desc">Biaya pengiriman</span>
                  <span className="font-medium">Rp {computeOngkir().toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <div className="h-[1px] w-full bg-border mb-4" />

            <div className="flex justify-between items-center mb-8">
              <span className="text-body-medium text-text-main">Total Tagihan</span>
              <span className="text-h2 text-primary-700">
                Rp {((Number(data.price_per_rak || 0) * parsedQuantity) + computeOngkir()).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button variant="secondary" onClick={() => setShowSummary(false)} className="w-full h-[48px]">
                Kembali
              </Button>
              <Button onClick={handleConfirmOrder} variant="primary" className="w-full h-[48px]">
                Konfirmasi Pesanan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
