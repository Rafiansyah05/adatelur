'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export interface RecommendParams {
  rak_quantity: number;
  fulfillment_method: 'pickup' | 'delivery';
  consumer_lat?: number;
  consumer_lng?: number;
}

export interface RecommendationResult {
  listing_id: string;
  peternak_id: string;
  peternak_name: string;
  avatar_url: string;
  price_per_rak: number;
  final_score: number;
  distance_km: number;
  ongkir_amount: number;
  total_cost: number;
}

async function fetchRecommendations(params: RecommendParams): Promise<{ data: RecommendationResult[] }> {
  const res = await fetch('/api/orders/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return res.json();
}
import { ScoreCard } from '@/components/ui/ScoreCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [rakQuantity, setRakQuantity] = useState<number>(1);
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const mutation = useMutation({
    mutationFn: (params: RecommendParams) => fetchRecommendations(params),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (rakQuantity < 1) {
      setErrorMsg('Jumlah rak minimal 1');
      return;
    }

    if (method === 'delivery') {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            mutation.mutate({
              rak_quantity: rakQuantity,
              fulfillment_method: 'delivery',
              consumer_lat: position.coords.latitude,
              consumer_lng: position.coords.longitude,
            });
          },
          () => {
            setErrorMsg('Akses lokasi ditolak atau gagal. Mohon izinkan akses lokasi untuk pengiriman.');
          }
        );
      } else {
        setErrorMsg('Geolocation tidak didukung di browser ini.');
      }
    } else {
      mutation.mutate({
        rak_quantity: rakQuantity,
        fulfillment_method: 'pickup',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="w-full">
      <div className="bg-primary-50 px-4 py-8">
        <h1 className="text-display mb-2 text-text-main">Pesan Telur Segar</h1>
        <p className="text-body text-text-main mb-6">
          Langsung dari peternak ke tempat Anda.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border bg-white p-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rak_quantity">Jumlah Rak (1 Rak = 30 Butir)</Label>
            <Input
              id="rak_quantity"
              type="number"
              min="1"
              value={rakQuantity}
              onChange={(e) => setRakQuantity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Metode Pengambilan</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-body-medium">
                <input
                  type="radio"
                  name="method"
                  value="pickup"
                  checked={method === 'pickup'}
                  onChange={() => setMethod('pickup')}
                  className="accent-primary-400"
                />
                Ambil Sendiri
              </label>
              <label className="flex items-center gap-2 text-body-medium">
                <input
                  type="radio"
                  name="method"
                  value="delivery"
                  checked={method === 'delivery'}
                  onChange={() => setMethod('delivery')}
                  className="accent-primary-400"
                />
                Diantar (Delivery)
              </label>
            </div>
          </div>

          {errorMsg && <p className="text-sm font-semibold text-[#E23D28]">{errorMsg}</p>}

          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Mencari...' : 'Cari Peternak'}
          </Button>
        </form>
      </div>

      <div className="px-4 py-6">
        {mutation.isError && (
          <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-primary-50 p-8 text-center">
            <span className="text-[32px]">🥺</span>
            <h2 className="text-h3 text-text-main">Waduh, koneksi terputus!</h2>
            <p className="text-[14px] text-text-desc">Sistem gagal mengambil rekomendasi peternak. Silakan periksa koneksi Anda dan coba lagi.</p>
          </div>
        )}
        
        {mutation.isSuccess && (
          <div className="flex flex-col gap-4">
            <h2 className="text-h2 text-text-main">Rekomendasi Terbaik</h2>
            {mutation.data.data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-cream p-8 text-center">
                <span className="text-[32px]">🤷‍♂️</span>
                <h2 className="text-h3 text-text-main">Belum Ada Peternak Tersedia</h2>
                <p className="text-[14px] text-text-desc">Maaf, sepertinya belum ada peternak yang aktif atau memiliki stok telur di sekitar Anda saat ini.</p>
              </div>
            ) : (
              mutation.data.data.map((item, index) => (
                <ScoreCard
                  key={item.listing_id}
                  peternakName={item.peternak_name}
                  avatarInitials={getInitials(item.peternak_name)}
                  rating={4.8} 
                  score={item.final_score}
                  pricePerRak={item.price_per_rak}
                  estimatedOngkir={item.ongkir_amount}
                  isTopPick={index === 0}
                  onPesanClick={() => router.push(`/peternak/${item.peternak_id}?rak=${rakQuantity}&method=${method}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
