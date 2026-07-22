'use client';

import { useQuery } from '@tanstack/react-query';

export interface PeternakProfile {
  id: string;
  farm_address: string;
  farm_latitude: number;
  farm_longitude: number;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
  peternak_scores: {
    final_score: number;
    average_rating: number;
  };
}

export interface DeliverySlot {
  id: string;
  peternak_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface PeternakDetailResult {
  profile: PeternakProfile;
  delivery_slots: DeliverySlot[];
}

async function fetchPeternakDetail(id: string): Promise<{ data: PeternakDetailResult }> {
  const res = await fetch(`/api/peternak/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch peternak detail');
  }
  return res.json();
}
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Star, ArrowLeft, MapPin } from 'lucide-react';

export default function PeternakDetail() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const id = params.id as string;
  const rakQuantity = Number(searchParams.get('rak')) || 1;
  const method = searchParams.get('method') || 'pickup';

  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['peternak', id],
    queryFn: () => fetchPeternakDetail(id),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-body text-text-main">Memuat detail peternak...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-4">
        <p className="font-semibold text-[#E23D28] text-[14px]">Peternak tidak ditemukan.</p>
        <Button variant="secondary" onClick={() => router.back()}>Kembali</Button>
      </div>
    );
  }

  const profile = data.data.profile;
  const slots = data.data.delivery_slots;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handlePesan = () => {
    if (!selectedSlot) {
      alert('Pilih slot pengiriman/pengambilan terlebih dahulu.');
      return;
    }
    alert('Order diproses dengan slot: ' + selectedSlot);
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-white px-4 py-4">
        <button onClick={() => router.back()} className="text-text-main">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-h1 text-text-main">Detail Peternak</h1>
      </div>

      <div className="px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-h2 text-primary-950">
            {getInitials(profile.profiles.full_name)}
          </div>
          <div>
            <h2 className="text-h2 text-text-main">{profile.profiles.full_name}</h2>
            <div className="mt-1 flex items-center gap-2 text-[14px] text-text-main">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary-400 text-primary-400" />
                {profile.peternak_scores.average_rating.toFixed(1)}
              </span>
              <span className="text-border">|</span>
              <span className="font-bold">Score {profile.peternak_scores.final_score}</span>
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-start gap-2 text-[14px] text-text-desc">
          <MapPin className="h-5 w-5 shrink-0" />
          <p>{profile.farm_address}</p>
        </div>

        <h3 className="mb-4 text-h3 text-text-main">Pilih Waktu {method === 'delivery' ? 'Pengiriman' : 'Pengambilan'}</h3>
        
        {slots.length === 0 ? (
          <p className="mb-8 text-[14px] text-text-desc">Tidak ada slot tersedia.</p>
        ) : (
          <div className="mb-8 flex flex-col gap-3">
            {slots.map((slot) => (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-center justify-between rounded-md border p-4 ${
                  selectedSlot === slot.id ? 'border-primary-400 bg-primary-50' : 'border-border bg-white'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-text-main text-[14px]">{slot.slot_date}</span>
                  <span className="text-[14px] text-text-desc">{slot.start_time} - {slot.end_time}</span>
                </div>
                <input
                  type="radio"
                  name="slot"
                  value={slot.id}
                  checked={selectedSlot === slot.id}
                  onChange={() => setSelectedSlot(slot.id)}
                  className="h-5 w-5 accent-primary-400"
                />
              </label>
            ))}
          </div>
        )}

        <Card className="flex flex-col gap-4">
          <div className="flex justify-between text-[14px] text-text-main">
            <span>Jumlah Pesanan</span>
            <span className="font-semibold">{rakQuantity} Rak</span>
          </div>
          <div className="flex justify-between text-[14px] text-text-main">
            <span>Metode</span>
            <span className="font-semibold capitalize">{method}</span>
          </div>
          <Button variant="primary" className="mt-2 w-full" onClick={handlePesan}>
            Pesan Sekarang
          </Button>
        </Card>
      </div>
    </main>
  );
}
