'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { MapPin, Search as SearchIcon, ArrowRight, X } from 'lucide-react';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';
import { OrderModal } from '@/components/ui/OrderModal';
import { Button } from '@/components/ui/Button';

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  
  const [q, setQ] = useState(initialQ);
  
  useEffect(() => {
    setQ(searchParams.get('q') || '');
  }, [searchParams]);
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Popup states
  const [selectedPeternak, setSelectedPeternak] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStep, setPopupStep] = useState<1 | 2>(1);
  const [peternakDetail, setPeternakDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [consumerAddress, setConsumerAddress] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, peternak_details(farm_address)')
          .eq('role', 'peternak')
          .ilike('full_name', `%${q}%`)
          .limit(20);
          
        if (error) throw error;
        
        const formattedData = (data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          address: Array.isArray(p.peternak_details) ? (p.peternak_details[0] as any)?.farm_address : (p.peternak_details as any)?.farm_address
        }));
        
        setResults(formattedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchResults();
  }, [q]);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleCardClick = async (peternak: any) => {
    setSelectedPeternak(peternak);
    setShowPopup(true);
    setPopupStep(1);
    setLoadingDetail(true);
    setQuantity(1);
    setMethod('pickup');
    
    try {
      const [petRes, addrRes] = await Promise.all([
        fetch(`/api/peternak/${peternak.id}`).then((r) => r.json()),
        fetch('/api/consumer/address').then((r) => r.json()).catch(() => null),
      ]);
      setPeternakDetail(petRes.data || null);
      setConsumerAddress(addrRes?.address || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const computeOngkir = () => {
    if (method === 'pickup' || !consumerAddress || !peternakDetail?.farm_latitude || !peternakDetail?.farm_longitude)
      return 0;
    const d = haversineDistance(
      peternakDetail.farm_latitude,
      peternakDetail.farm_longitude,
      Number(consumerAddress.latitude),
      Number(consumerAddress.longitude)
    );
    return calculateOngkir(d);
  };

  const computeDistance = () => {
    if (!consumerAddress || !peternakDetail?.farm_latitude || !peternakDetail?.farm_longitude)
      return null;
    return haversineDistance(
      peternakDetail.farm_latitude,
      peternakDetail.farm_longitude,
      Number(consumerAddress.latitude),
      Number(consumerAddress.longitude)
    );
  };

  const availableStock = peternakDetail ? (peternakDetail.stock_rak || 0) - (peternakDetail.sold_rak_today || 0) : 0;
  const isOverStock = quantity > availableStock;

  const handleLanjut = () => {
    setShowPopup(false);
    setShowOrderModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-4xl py-6 md:py-8 relative">
      <div className="hidden md:block mb-8">
        <h1 className="text-display text-text-main mb-4">Cari Peternak</h1>
        <div className="relative w-full max-w-2xl">
          <input
            type="text"
            autoFocus
            placeholder="Ketik nama peternak..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-full bg-white border border-neutral-200 py-4 pl-12 pr-4 text-lg font-medium text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-400" />
        </div>
        
        {q && (
          <p className="text-body-medium text-text-desc mt-4">
            Menampilkan hasil untuk: <span className="font-bold text-text-main">&quot;{q}&quot;</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((peternak) => (
            <div 
              key={peternak.id} 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCardClick(peternak);
              }}
              className="cursor-pointer"
            >
              <Card className="p-4 flex items-start gap-4 transition-all hover:border-primary-400 hover:shadow-md h-full">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-50 border border-primary-100 text-primary-900 font-bold text-lg overflow-hidden">
                  {peternak.avatar_url ? (
                    <img 
                      src={peternak.avatar_url} 
                      alt={peternak.full_name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(peternak.full_name)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-body-medium font-bold text-text-main mb-1 line-clamp-1">{peternak.full_name}</h3>
                  <div className="flex items-start gap-1 text-text-desc text-xs line-clamp-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{peternak.address || 'Alamat belum tersedia'}</span>
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-text-desc mt-4">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : q ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <SearchIcon className="h-8 w-8" />
          </div>
          <h3 className="text-h3 text-text-main mb-2">Pencarian Tidak Ditemukan</h3>
          <p className="text-body-small text-text-desc max-w-sm">
            Maaf, kami tidak menemukan peternak dengan nama &quot;{q}&quot;. Coba gunakan kata kunci lain.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-body-medium text-text-desc">Silakan masukkan nama peternak untuk memulai pencarian.</p>
        </div>
      )}

      {/* Peternak Detail & Order Input Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-6 relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            {loadingDetail ? (
              <div className="py-12 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
              </div>
            ) : !peternakDetail ? (
              <div className="py-12 text-center text-text-desc">Gagal memuat detail peternak.</div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-950 font-bold text-xl overflow-hidden">
                    {peternakDetail.profiles?.avatar_url ? (
                      <img 
                        src={peternakDetail.profiles.avatar_url} 
                        alt={peternakDetail.full_name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(peternakDetail.full_name || '')}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-h3 text-text-main mb-1">{peternakDetail.full_name}</h2>
                    <div className="flex items-center gap-2 text-xs text-text-desc mb-1">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{selectedPeternak?.address || 'Alamat tidak tersedia'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-text-main">⭐ {peternakDetail.rating || '4.8'}</span>
                      <span className="text-neutral-300">•</span>
                      <span className="rounded-sm bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-900">
                        Score {peternakDetail.score || 85}
                      </span>
                      {computeDistance() !== null && (
                        <>
                          <span className="text-neutral-300">•</span>
                          <span className="text-xs text-text-desc">{computeDistance()?.toFixed(1)} km</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {popupStep === 1 ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-text-desc">Harga per rak</span>
                      <span className="text-h3 text-text-main">Rp {Number(peternakDetail.price_per_rak || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <Button variant="primary" className="w-full h-[48px]" onClick={() => setPopupStep(2)}>
                      Pesan Sekarang
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <label className="text-body-medium font-bold text-text-main block mb-2">Jumlah Rak</label>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-main hover:bg-bg-surface"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className={`w-20 h-10 text-center text-h3 rounded-md border ${isOverStock ? 'border-danger text-danger bg-red-50 focus:ring-danger' : 'border-border focus:ring-primary-500'} focus:outline-none focus:ring-2`}
                        />
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-main hover:bg-bg-surface"
                        >
                          +
                        </button>
                      </div>
                      {isOverStock && (
                        <p className="text-xs text-danger mt-2 font-medium">Stok tidak mencukupi. Sisa stok hari ini: {availableStock} rak.</p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="text-body-medium font-bold text-text-main block mb-2">Metode Pengiriman</label>
                      <div className="flex gap-4">
                        <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm font-bold transition-colors ${method === 'pickup' ? 'border-primary-400 bg-primary-50 text-primary-950' : 'border-border bg-white text-text-main'}`}>
                          <input type="radio" checked={method === 'pickup'} onChange={() => setMethod('pickup')} className="hidden" />
                          Ambil Sendiri
                        </label>
                        <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm font-bold transition-colors ${method === 'delivery' ? 'border-primary-400 bg-primary-50 text-primary-950' : 'border-border bg-white text-text-main'}`}>
                          <input type="radio" checked={method === 'delivery'} onChange={() => setMethod('delivery')} className="hidden" />
                          Diantar
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => setPopupStep(1)} className="w-1/3">
                        Kembali
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleLanjut} 
                        className="flex-1"
                        disabled={isOverStock}
                      >
                        Lanjut
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Order Modal (Pilih Slot & Alamat) */}
      {showOrderModal && peternakDetail && (
        <OrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          peternakId={peternakDetail.id}
          peternakName={peternakDetail.full_name}
          rakQuantity={quantity}
          method={method}
          pricePerRak={peternakDetail.price_per_rak}
          estimatedOngkir={computeOngkir()}
          listingId={peternakDetail.listing_id}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-desc">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
