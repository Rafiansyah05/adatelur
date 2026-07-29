'use client';

import { useState, useEffect } from 'react';
import { ScoreCard } from '@/components/ui/ScoreCard';
import { TopPeternakCard } from '@/components/ui/TopPeternakCard';
import { OrderModal } from '@/components/ui/OrderModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export interface RecommendParams {
  rak_quantity: number;
  fulfillment_method: 'pickup' | 'delivery';
  consumer_lat?: number;
  consumer_lng?: number;
  sort_by?: 'score' | 'efficiency' | 'distance';
  ignore_stock?: boolean;
}

export interface RecommendationResult {
  listing_id: string;
  peternak_id: string;
  peternak_name: string;
  avatar_url: string;
  farm_address: string;
  price_per_rak: number;
  final_score: number;
  average_rating: number;
  total_completed_orders: number;
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

export default function Home() {
  const router = useRouter();
  const [rakQuantity, setRakQuantity] = useState<number | ''>(1);
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');

  const [topPeternak, setTopPeternak] = useState<RecommendationResult[]>([]);
  const [isLoadingTop, setIsLoadingTop] = useState(true);

  const [nearestPeternak, setNearestPeternak] = useState<RecommendationResult[]>([]);
  const [isLoadingNearest, setIsLoadingNearest] = useState(true);

  const [selectedPeternak, setSelectedPeternak] = useState<RecommendationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Listen to custom event for peternak removal if timeout
  useEffect(() => {
    const handleRemove = (e: any) => {
      setTopPeternak(prev => prev.filter(p => p.peternak_id !== e.detail));
    };
    window.addEventListener('remove-peternak-recommendation', handleRemove);
    return () => window.removeEventListener('remove-peternak-recommendation', handleRemove);
  }, []);

  // Fetch Peternak Terbaik and Peternak Terdekat on mount
  useEffect(() => {
    async function fetchTop(lat?: number, lng?: number) {
      try {
        const result = await fetchRecommendations({
          rak_quantity: 1,
          fulfillment_method: 'pickup',
          consumer_lat: lat,
          consumer_lng: lng,
          sort_by: 'score',
          ignore_stock: true
        });
        setTopPeternak(result.data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingTop(false);
      }
    }

    async function fetchNearest(lat?: number, lng?: number) {
      try {
        if (lat === undefined || lng === undefined) {
          setIsLoadingNearest(false);
          return; // Don't fetch if no coordinates
        }
        const result = await fetchRecommendations({
          rak_quantity: 1,
          fulfillment_method: 'delivery',
          consumer_lat: lat,
          consumer_lng: lng,
          sort_by: 'distance',
        });
        setNearestPeternak(result.data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingNearest(false);
      }
    }

    async function loadData() {
      let lat: number | undefined;
      let lng: number | undefined;

      try {
        const addrRes = await fetch('/api/consumer/address');
        if (addrRes.ok) {
          const { address } = await addrRes.json();
          if (address?.latitude && address?.longitude) {
            lat = Number(address.latitude);
            lng = Number(address.longitude);
          }
        }
      } catch (e) {
        console.error(e);
      }

      if (!lat || !lng) {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              fetchTop(position.coords.latitude, position.coords.longitude);
              fetchNearest(position.coords.latitude, position.coords.longitude);
            },
            () => {
              fetchTop();
              setIsLoadingNearest(false);
            }
          );
          return;
        }
      }

      fetchTop(lat, lng);
      fetchNearest(lat, lng);
    }

    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (rakQuantity === '' || rakQuantity < 1) return;
    router.push(`/recommendations?rak=${rakQuantity}&method=${method}`);
  };

  const handleReset = () => {
    setRakQuantity(1);
    setMethod('pickup');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full flex flex-col gap-10 md:gap-24 pb-4 -mt-6 md:-mt-8">
      {/* HERO SECTION */}
      <section className="relative w-screen ml-[calc(-50vw+50%)] overflow-hidden bg-primary-950 min-h-[400px] md:min-h-[600px] flex items-center">
        {/* Banner Background */}
        <div className="absolute inset-0 z-0 bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/banner1.jpg"
            alt="Banner Telur Segar"
            className="h-full w-full object-cover opacity-50"
          />
        </div>

        <div className="relative z-10 w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 p-6 md:p-8 items-center">
          {/* Left Grid: Branding (Hidden on mobile) */}
          <div className="hidden lg:flex flex-col gap-4 relative">
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-lg bg-white shadow-lg">
              <Image src="/icons/icon-512x512.png" alt="Logo" width={48} height={48} className="object-contain" />
            </div>
            <div className="relative z-10 flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-primary-400 tracking-tight">adatelur.</h1>
              <h2 className="text-4xl font-bold text-white leading-tight mt-2">
                Telur Segar,<br />Langsung dari Peternak.
              </h2>
              <p className="text-neutral-200 font-medium text-base max-w-md mt-1 leading-relaxed">
                Platform terbaik untuk mencari, membandingkan, dan memesan telur berkualitas dengan harga tangan pertama.
              </p>
            </div>
          </div>

          {/* Right Grid: Input Form Container */}
          <div className="w-full max-w-lg mx-auto lg:ml-auto lg:mr-0 bg-white rounded-lg p-6 border border-neutral-100">
            <h3 className="text-xl font-bold text-neutral-900 mb-5">Cari Peternak</h3>
            <form onSubmit={handleSearch} className="flex flex-col gap-5">

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rak_quantity" className="font-semibold text-neutral-700">Jumlah Rak</Label>
                  <Input
                    id="rak_quantity"
                    type="number"
                    min="1"
                    value={rakQuantity}
                    onChange={(e) => setRakQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-12 rounded-lg text-lg bg-white border-neutral-100 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="font-semibold text-neutral-700">Metode</Label>
                  <div className="relative">
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as 'pickup' | 'delivery')}
                      className="w-full h-12 appearance-none rounded-lg bg-white border border-neutral-100 px-4 text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    >
                      <option value="pickup">Ambil (Pickup)</option>
                      <option value="delivery">Diantar (Delivery)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="h-12 rounded-lg font-semibold text-neutral-600 border-neutral-100 bg-white hover:bg-neutral-50"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-12 rounded-lg font-semibold text-base transition-all"
                  disabled={rakQuantity === '' || rakQuantity < 1}
                >
                  Cari
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* PETERNAK TERDEKAT SECTION */}
      <section className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between px-2 gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-3xl font-black text-neutral-900 tracking-tight">Peternak Terdekat</h2>
            <p className="text-xs md:text-base text-neutral-500 font-medium">Berdasarkan lokasi Anda (Stok Tersedia).</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 hide-scrollbar">
          {isLoadingNearest ? (
            <div className="flex gap-6 min-w-max">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-[320px] md:w-[380px] h-[280px] bg-neutral-100 animate-pulse rounded-2xl shrink-0"></div>
              ))}
            </div>
          ) : nearestPeternak.length > 0 ? (
            <div className="flex gap-6 min-w-max">
              {nearestPeternak.map((item, index) => (
                <div key={item.listing_id} className="w-[320px] md:w-[380px] shrink-0">
                  <ScoreCard
                    className="bg-white border-neutral-200 hover:bg-neutral-50"
                    peternakName={item.peternak_name}
                    avatarUrl={item.avatar_url}
                    avatarInitials={getInitials(item.peternak_name)}
                    location={item.farm_address}
                    rating={item.average_rating || 0}
                    averageRating={item.average_rating}
                    totalOrders={item.total_completed_orders}
                    score={item.final_score}
                    pricePerRak={item.price_per_rak}
                    estimatedOngkir={item.ongkir_amount}
                    distanceKm={item.distance_km}
                    isTopPick={false}
                    rank={undefined}
                    hidePesanButton={false}
                    hideOngkir={false}
                    onPesanClick={() => {
                      setSelectedPeternak(item);
                      setIsModalOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full p-12 text-center bg-neutral-50 rounded-2xl text-neutral-500 text-sm">
              Belum ada peternak terdekat dengan stok tersedia saat ini.
            </div>
          )}
        </div>
      </section>

      {/* PETERNAK TERBAIK SECTION */}
      <section className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between px-2 gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-3xl font-black text-neutral-900 tracking-tight">Peternak Terbaik</h2>
            <p className="text-xs md:text-base text-neutral-500 font-medium">Berdasarkan skor dan kualitas sistem kami.</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 hide-scrollbar">
          {isLoadingTop ? (
            <div className="flex gap-6 min-w-max">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-[320px] md:w-[380px] h-[280px] bg-neutral-100 animate-pulse rounded-2xl shrink-0"></div>
              ))}
            </div>
          ) : topPeternak.length > 0 ? (
            <div className="flex gap-6 min-w-max">
              {topPeternak.map((item, index) => (
                <div key={item.listing_id} className="w-[320px] md:w-[380px] shrink-0">
                  <TopPeternakCard
                    className=""
                    peternakName={item.peternak_name}
                    avatarUrl={item.avatar_url}
                    avatarInitials={getInitials(item.peternak_name)}
                    location={item.farm_address}
                    rating={item.average_rating || 0}
                    averageRating={item.average_rating}
                    score={item.final_score}
                    rank={index + 1}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full p-12 text-center bg-neutral-50 rounded-2xl text-neutral-500">
              Belum ada data peternak terbaik saat ini.
            </div>
          )}
        </div>
      </section>

      {/* BANNER MITRA PETERNAK */}
      <section className="relative w-full rounded-lg overflow-hidden bg-neutral-900 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8 border border-neutral-100">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/banner2.jpg"
            alt="Peternakan Ayam"
            className="h-full w-full object-cover opacity-50"
          />
        </div>

        <div className="relative z-10 flex flex-col gap-3 max-w-2xl text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">
            Punya Peternakan Ayam Petelur?
          </h2>
          <p className="text-neutral-200 text-base leading-relaxed">
            Bergabunglah menjadi Mitra Adatelur. Perluas jangkauan pasar Anda, kelola pesanan dengan mudah, dan tingkatkan penjualan tanpa perantara.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link href="/register">
            <Button variant="primary" className="h-12 px-8 rounded-lg font-semibold text-base transition-all bg-white text-primary-900 hover:bg-neutral-50 border border-neutral-100">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Custom styles for hiding scrollbar but allowing scroll */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {selectedPeternak && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPeternak(null);
          }}
          peternakId={selectedPeternak.peternak_id}
          peternakName={selectedPeternak.peternak_name}
          rakQuantity={rakQuantity === '' ? 1 : rakQuantity}
          method={method}
          pricePerRak={selectedPeternak.price_per_rak}
          estimatedOngkir={selectedPeternak.ongkir_amount}
          listingId={selectedPeternak.listing_id}
        />
      )}
    </div>
  );
}
