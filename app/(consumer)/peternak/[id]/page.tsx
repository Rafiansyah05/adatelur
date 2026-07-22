'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface DeliverySlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface PeternakData {
  full_name?: string;
  rating?: string;
  score?: number;
  price_per_rak?: number;
  delivery_slots?: DeliverySlot[];
}

export default function PeternakDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<PeternakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  useEffect(() => {
    fetch(`/api/peternak/${params.id}`)
      .then(res => res.json())
      .then(d => {
        setData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-8 text-center text-text-desc">Memuat detail peternak...</div>;
  if (!data) return <div className="p-8 text-center text-text-desc">Peternak tidak ditemukan.</div>;

  const handlePesan = () => {
    if (!selectedSlot) {
      alert('Pilih slot waktu terlebih dahulu');
      return;
    }
    // Simulate order
    alert('Pesanan berhasil dibuat!');
    router.push('/orders');
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
            <span className="text-body-medium text-text-main">Rp {data.price_per_rak?.toLocaleString() || '45.000'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-body text-text-desc">Status</span>
            <span className="text-body-medium text-success-text bg-success-bg px-2 py-1 rounded-full text-caption">Tersedia</span>
          </div>
        </Card>

        <Card>
          <h2 className="text-h3 text-text-main mb-4">Pilih Waktu Pengiriman/Pengambilan</h2>
          {data.delivery_slots && data.delivery_slots.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.delivery_slots.map((slot: DeliverySlot) => (
                <label key={slot.id} className="flex items-center gap-3 border border-border rounded-md p-3">
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
                      {new Date(slot.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(slot.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
      </div>
    </div>
  );
}
