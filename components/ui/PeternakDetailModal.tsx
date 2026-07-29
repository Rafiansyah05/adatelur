'use client';

import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';
import { OrderModal } from '@/components/ui/OrderModal';

interface PeternakDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  peternak: any; // { id, full_name, avatar_url, address }
}

export function PeternakDetailModal({ isOpen, onClose, peternak }: PeternakDetailModalProps) {
  const [popupStep, setPopupStep] = useState<1 | 2>(1);
  const [peternakDetail, setPeternakDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [consumerAddress, setConsumerAddress] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (isOpen && peternak) {
      setPopupStep(1);
      setQuantity(1);
      setMethod('pickup');
      setLoadingDetail(true);
      setShowOrderModal(false);

      Promise.all([
        fetch(`/api/peternak/${peternak.id}`).then((r) => r.json()),
        fetch('/api/consumer/address').then((r) => r.json()).catch(() => null),
      ])
        .then(([petRes, addrRes]) => {
          setPeternakDetail(petRes.data || null);
          setConsumerAddress(addrRes?.address || null);
        })
        .catch((e) => console.error(e))
        .finally(() => setLoadingDetail(false));
    }
  }, [isOpen, peternak]);

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
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

  const parsedQuantity = typeof quantity === 'number' ? quantity : 0;
  const availableStock = peternakDetail ? (peternakDetail.stock_rak || 0) - (peternakDetail.sold_rak_today || 0) : 0;
  const isOverStock = parsedQuantity > availableStock;

  const handleLanjut = () => {
    setShowOrderModal(true);
  };

  const handleModalClose = () => {
    if (!showOrderModal) {
      onClose();
    }
  };

  if (showOrderModal && peternakDetail) {
    return (
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          onClose(); // close entirely
        }}
        peternakId={peternakDetail.id}
        peternakName={peternakDetail.full_name}
        rakQuantity={parsedQuantity}
        method={method}
        pricePerRak={peternakDetail.price_per_rak}
        estimatedOngkir={computeOngkir()}
        listingId={peternakDetail.listing_id}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleModalClose}>
      <div className="w-full max-w-md bg-white rounded-xl p-6 relative animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
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
                {peternak?.avatar_url || peternakDetail?.profiles?.avatar_url ? (
                  <img 
                    src={peternak?.avatar_url || peternakDetail?.profiles?.avatar_url} 
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
                  <span className="line-clamp-1">{peternak?.address || 'Alamat tidak tersedia'}</span>
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
                      onClick={() => setQuantity(Math.max(1, (typeof quantity === 'number' ? quantity : 0) - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-main hover:bg-bg-surface disabled:opacity-50"
                      disabled={typeof quantity === 'number' && quantity <= 1}
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
                      className={`w-20 h-10 text-center text-h3 rounded-md border ${isOverStock ? 'border-danger text-danger bg-red-50 focus:ring-danger' : 'border-border focus:ring-primary-500'} focus:outline-none focus:ring-2`}
                    />
                    <button 
                      onClick={() => setQuantity((typeof quantity === 'number' ? quantity : 0) + 1)}
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
                    disabled={isOverStock || !quantity}
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
  );
}
