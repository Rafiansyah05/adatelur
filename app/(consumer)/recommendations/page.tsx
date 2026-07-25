'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ScoreCard } from '@/components/ui/ScoreCard';
import { OrderModal } from '@/components/ui/OrderModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ChevronLeft, AlertCircle, SearchX } from 'lucide-react';
import { RecommendParams, RecommendationResult } from '../page'; // Reuse types

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

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRak = parseInt(searchParams.get('rak') || '1', 10);
  const initialMethod = (searchParams.get('method') as 'pickup' | 'delivery') || 'pickup';

  const [rakQuantity, setRakQuantity] = useState<number>(initialRak);
  const [method, setMethod] = useState<'pickup' | 'delivery'>(initialMethod);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const [selectedPeternak, setSelectedPeternak] = useState<RecommendationResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to load recommendations
  const loadRecommendations = (qty: number, meth: 'pickup' | 'delivery') => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchRecommendations({
            rak_quantity: qty,
            fulfillment_method: meth,
            consumer_lat: position.coords.latitude,
            consumer_lng: position.coords.longitude,
          }).then(res => {
            setResults(res.data);
          }).catch(err => {
            console.error(err);
            setIsError(true);
          }).finally(() => {
            setIsLoading(false);
          });
        },
        () => {
          if (meth === 'delivery') {
            setErrorMsg('Akses lokasi ditolak atau gagal. Mohon izinkan akses lokasi untuk pengiriman.');
            setIsLoading(false);
            setIsError(true);
          } else {
            // For pickup, proceed without location
            fetchRecommendations({
              rak_quantity: qty,
              fulfillment_method: 'pickup',
            }).then(res => {
              setResults(res.data);
            }).catch(err => {
              console.error(err);
              setIsError(true);
            }).finally(() => {
              setIsLoading(false);
            });
          }
        }
      );
    } else {
      if (meth === 'delivery') {
        setErrorMsg('Geolocation tidak didukung di browser ini.');
        setIsLoading(false);
        setIsError(true);
      } else {
        // For pickup, proceed without location
        fetchRecommendations({
          rak_quantity: qty,
          fulfillment_method: 'pickup',
        }).then(res => {
          setResults(res.data);
        }).catch(err => {
          console.error(err);
          setIsError(true);
        }).finally(() => {
          setIsLoading(false);
        });
      }
    }
  };

  // Run on mount based on initial params
  useEffect(() => {
    loadRecommendations(initialRak, initialMethod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (rakQuantity < 1) {
      setErrorMsg('Jumlah rak minimal 1');
      return;
    }
    // Update URL without reloading
    router.replace(`/recommendations?rak=${rakQuantity}&method=${method}`);
    loadRecommendations(rakQuantity, method);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col w-full min-h-screen pb-10 bg-neutral-50/50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-neutral-100 px-4 flex items-center shadow-sm">
        <button
          onClick={() => router.back()}
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors mr-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-neutral-900 tracking-tight">Rekomendasi Peternak</h1>
      </div>

      {/* Main Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] gap-8 md:mt-4 mt-20 px-4 md:px-0 max-w-7xl mx-auto">

        {/* Left Grid: Sticky Form */}
        <div className="w-full">
          <div className="md:sticky md:top-24 bg-white md:border border-neutral-100 md:shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-5 hidden md:block">Sesuaikan Pesanan</h2>

            <form onSubmit={handleApply} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rak_quantity" className="font-semibold text-neutral-700">Jumlah Rak</Label>
                <Input
                  id="rak_quantity"
                  type="number"
                  min="1"
                  value={rakQuantity}
                  onChange={(e) => setRakQuantity(Number(e.target.value))}
                  className="h-12 rounded-xl text-lg bg-neutral-50 border-neutral-200 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="font-semibold text-neutral-700">Metode Pengantaran</Label>
                <div className="relative">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'pickup' | 'delivery')}
                    className="w-full h-12 appearance-none rounded-lg bg-neutral-50 border border-neutral-100 px-4 text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  >
                    <option value="pickup">Ambil Sendiri (Pickup)</option>
                    <option value="delivery">Diantar (Delivery)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>

              {errorMsg && <p className="text-sm font-semibold text-danger">{errorMsg}</p>}

              <Button
                type="submit"
                variant="primary"
                className="h-12 w-full mt-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Mencari...' : 'Terapkan'}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Grid: Results */}
        <div className="w-full flex flex-col gap-6 md:pt-0 pt-2 px-1">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-[280px] bg-neutral-100 animate-pulse rounded-lg border border-neutral-100"></div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-100 bg-red-50 p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <h2 className="text-xl font-bold text-neutral-900">Gagal Mengambil Data</h2>
              <p className="text-sm text-neutral-500 max-w-sm">
                Sistem gagal mengambil rekomendasi peternak. Silakan periksa koneksi internet Anda atau coba ubah metode pengantaran.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-neutral-100 bg-white p-12 text-center shadow-sm">
              <SearchX className="h-12 w-12 text-neutral-400" />
              <h2 className="text-xl font-bold text-neutral-900">Belum Ada Peternak</h2>
              <p className="text-sm text-neutral-500 max-w-sm">
                Maaf, sepertinya belum ada peternak yang cocok dengan kriteria pencarian Anda saat ini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-neutral-500">{results.length} peternak direkomendasikan</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {results.map((item, index) => (
                  <ScoreCard
                    key={item.listing_id}
                    peternakName={item.peternak_name}
                    avatarInitials={getInitials(item.peternak_name)}
                    rating={item.average_rating || 0}
                    averageRating={item.average_rating}
                    totalOrders={item.total_completed_orders}
                    score={item.final_score}
                    pricePerRak={item.price_per_rak}
                    rakQuantity={rakQuantity}
                    estimatedOngkir={item.ongkir_amount}
                    distanceKm={item.distance_km}
                    isTopPick={index === 0}
                    onPesanClick={() => {
                      setSelectedPeternak(item);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPeternak && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPeternak(null);
          }}
          peternakId={selectedPeternak.peternak_id}
          peternakName={selectedPeternak.peternak_name}
          rakQuantity={rakQuantity}
          method={method as 'pickup' | 'delivery'}
          pricePerRak={selectedPeternak.price_per_rak}
          estimatedOngkir={selectedPeternak.ongkir_amount}
          listingId={selectedPeternak.listing_id}
        />
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
      <RecommendationsContent />
    </Suspense>
  );
}
