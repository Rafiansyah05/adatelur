'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';
import { createClient } from '@/lib/supabase/client';

interface DeliverySlot {
  id: string;
  slot_date?: string;
  start_time: string;
  end_time: string;
}

interface PeternakData {
  full_name?: string;
  rating?: string;
  score?: number;
  price_per_rak?: number;
  delivery_slots?: DeliverySlot[];
  farm_latitude?: number;
  farm_longitude?: number;
  listing_id?: string;
}

export default function PeternakDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<PeternakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
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
      alert('Pilih slot waktu terlebih dahulu');
      return;
    }
    // show summary modal
    setShowSummary(true);
    // save last search for possible re-route
    try {
      sessionStorage.setItem('last_recommend_params', JSON.stringify({ quantity, method }));
    } catch {}
  };

  const handleConfirmOrder = async () => {
    if (!data.listing_id) {
      alert('Listing tidak ditemukan');
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
      alert(json.error || 'Gagal membuat pesanan');
      return;
    }
    setShowSummary(false);
    router.push(`/orders/${json.order.id}`);
  };

  return (
    <div className="w-full">
      <div className="bg-primary-50 px-4 py-8">
        <h1 className="text-h1 text-text-main mb-2">{data.full_name || 'Peternak'}</h1>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary-600">⭐ {data.rating || '4.8'}</span>
          <span className="text-text-desc">•</span>
          <span className="text-text-desc">Score {data.score || 85}</span>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col gap-6">
        <Card>
          <h2 className="text-h3 text-text-main mb-4">Harga & Stok</h2>
          <div className="flex justify-between items-center mb-2">
            <span className="text-body text-text-desc">Harga per rak</span>
            <span className="text-body-medium text-text-main">
              Rp {data.price_per_rak ? Number(data.price_per_rak).toLocaleString() : '45.000'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="text-body">Jumlah rak</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value || 1))}
              className="w-24 rounded-md border border-border p-2"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-body text-text-desc">Status</span>
            <span className="text-body-medium text-success-text bg-success-bg px-2 py-1 rounded-full text-caption">
              Tersedia
            </span>
          </div>
        </Card>

        <Card>
          <h2 className="text-h3 text-text-main mb-4">Pilih Waktu Pengiriman/Pengambilan</h2>
          <div className="flex gap-4 mb-4">
            <label
              className={`px-3 py-2 rounded-md border ${method === 'pickup' ? 'border-primary-400 bg-primary-50' : 'border-border'}`}
            >
              <input
                type="radio"
                name="method"
                checked={method === 'pickup'}
                onChange={() => setMethod('pickup')}
              />{' '}
              Pickup
            </label>
            <label
              className={`px-3 py-2 rounded-md border ${method === 'delivery' ? 'border-primary-400 bg-primary-50' : 'border-border'}`}
            >
              <input
                type="radio"
                name="method"
                checked={method === 'delivery'}
                onChange={() => setMethod('delivery')}
              />{' '}
              Delivery
            </label>
          </div>
          {data.delivery_slots && data.delivery_slots.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.delivery_slots.map((slot: DeliverySlot) => (
                <label
                  key={slot.id}
                  className="flex items-center gap-3 border border-border rounded-md p-3"
                >
                  <input
                    type="radio"
                    name="slot"
                    value={slot.id}
                    checked={selectedSlot === slot.id}
                    onChange={() => setSelectedSlot(slot.id)}
                    className="accent-primary-400"
                  />
                  <div className="flex flex-col">
                    <span className="text-body-medium text-text-main">
                      {new Date(slot.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(slot.end_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-body text-text-desc">Belum ada slot waktu tersedia hari ini.</p>
          )}
        </Card>

        <Button onClick={handlePesan} className="w-full mt-4" variant="primary">
          Pesan Sekarang
        </Button>

        {showSummary && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowSummary(false)} />
            <div className="relative w-full max-w-md rounded-md bg-white p-6">
              <h3 className="text-h3 mb-3">Ringkasan Pesanan</h3>
              <div className="mb-2 flex justify-between">
                <span>Harga per rak</span>
                <span>Rp {data.price_per_rak?.toLocaleString() || '0'}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span>Jumlah rak</span>
                <span>{quantity}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span>Metode</span>
                <span>{method === 'pickup' ? 'Ambil Sendiri' : 'Diantar'}</span>
              </div>
              <div className="mb-2 flex justify-between">
                <span>Estimasi ongkir</span>
                <span>Rp {computeOngkir().toLocaleString()}</span>
              </div>
              <div className="mb-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  Rp{' '}
                  {(Number(data.price_per_rak || 0) * quantity + computeOngkir()).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowSummary(false)}>
                  Batal
                </Button>
                <Button onClick={handleConfirmOrder} className="ml-auto">
                  Konfirmasi & Bayar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
