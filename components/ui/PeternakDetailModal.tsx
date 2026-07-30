'use client';

import { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { haversineDistance, calculateOngkir } from '@/lib/haversine';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/components/ui/toast';

interface PeternakDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  peternak: any;
  initialStep?: 1 | 2;
  fixedQuantity?: number;
  fixedMethod?: 'pickup' | 'delivery';
  isFixedOrderParams?: boolean;
}

export function PeternakDetailModal({
  isOpen,
  onClose,
  peternak,
  initialStep = 2,
  fixedQuantity,
  fixedMethod,
  isFixedOrderParams = false,
}: PeternakDetailModalProps) {
  const [popupStep, setPopupStep] = useState<1 | 2>(initialStep);
  const [peternakDetail, setPeternakDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [consumerAddress, setConsumerAddress] = useState<any>(null);

  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [addressId, setAddressId] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<{ id: string; label: string }[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && peternak) {
      setPopupStep(initialStep);
      setQuantity(fixedQuantity ?? 1);
      setMethod(fixedMethod ?? 'pickup');
      setLoadingDetail(true);
      setIsLoadingSlots(true);

      const fetchDetail = async () => {
        try {
          const [petRes, { data: { user } }] = await Promise.all([
            fetch(`/api/peternak/${peternak.id}`).then((r) => r.json()),
            supabase.auth.getUser(),
          ]);

          const detail = petRes.data;
          setPeternakDetail(detail || null);

          if (detail?.has_vehicle === false) {
            setMethod('pickup');
          }

          if (detail?.delivery_slots && Array.isArray(detail.delivery_slots) && detail.delivery_slots.length > 0) {
            const formattedSlots = detail.delivery_slots.map((slot: any) => ({
              id: slot.id,
              label: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`,
            }));
            setTimeSlots(formattedSlots);
            setSelectedSlot(formattedSlots[0].id);
          } else {
            setTimeSlots([]);
            setSelectedSlot('');
          }

          if (user) {
            const { data: userAddresses } = await supabase
              .from('consumer_addresses')
              .select('*')
              .eq('profile_id', user.id);
            if (userAddresses && userAddresses.length > 0) {
              setAddresses(userAddresses);
              setAddressId(userAddresses[0].id);
              setConsumerAddress(userAddresses[0]);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingDetail(false);
          setIsLoadingSlots(false);
        }
      };

      fetchDetail();
    }
  }, [isOpen, peternak, initialStep, fixedQuantity, fixedMethod, supabase]);

  if (!isOpen) return null;

  const displayName =
    peternakDetail?.farm_name || peternak?.farm_name || peternakDetail?.full_name || peternak?.full_name || peternak?.peternak_name || peternak?.name || 'Peternak Ada Telur';
  const displayAddress =
    peternak?.address || peternak?.farm_address || peternakDetail?.farm_address || 'Alamat tidak tersedia';
  const avatarSrc = peternak?.avatar_url || peternakDetail?.avatar_url || peternakDetail?.profiles?.avatar_url;

  const getInitials = (name: string) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
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
  const availableStock = peternakDetail
    ? Math.max(0, (peternakDetail.stock_rak || 0) - (peternakDetail.sold_rak_today || 0))
    : null;
  const isOverStock = availableStock !== null && parsedQuantity > availableStock;

  const handleLanjut = async () => {
    if (!quantity || quantity < 1) return showToast('Silakan masukkan jumlah rak yang valid!', 'error');
    if (availableStock !== null && quantity > availableStock) return showToast(`Stok tidak mencukupi. Sisa stok hari ini: ${availableStock} rak.`, 'error');
    if (!selectedSlot) return showToast('Silakan pilih slot waktu!', 'error');
    if (method === 'delivery' && !addressId) return showToast('Silakan pilih alamat pengiriman!', 'error');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: peternakDetail.listing_id,
          rakQuantity: quantity,
          fulfillmentMethod: method,
          consumerAddressId: method === 'delivery' ? addressId : null,
          deliverySlotId: selectedSlot || null,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      window.dispatchEvent(new CustomEvent('new-order-created', { detail: data.data.id }));
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl p-6 relative animate-in zoom-in-95 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-950 font-bold text-xl overflow-hidden">
            {avatarSrc ? (
              <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h2 className="text-h3 font-bold text-text-main mb-1 truncate">{displayName}</h2>
            <div className="flex items-center gap-2 text-xs text-text-desc mb-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="truncate">{displayAddress}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-text-main">
                ⭐ {peternakDetail?.rating || peternak?.rating || peternak?.average_rating || '4.8'}
              </span>
              <span className="text-neutral-300">•</span>
              <span className="rounded-sm bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-900">
                Score {peternakDetail?.score || peternak?.score || peternak?.final_score || 85}
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

        {loadingDetail ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          </div>
        ) : !peternakDetail ? (
          <div className="py-12 text-center text-text-desc">Gagal memuat detail peternak.</div>
        ) : (
          <>
            {popupStep === 1 ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-text-desc">Harga per rak</span>
                  <span className="text-h3 text-text-main">
                    Rp {Number(peternakDetail.price_per_rak || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <Button variant="primary" className="w-full h-[48px]" onClick={() => setPopupStep(2)}>
                  Pesan Sekarang
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 min-h-0 flex flex-col">
                <div className="flex-1 overflow-y-auto pr-2 mb-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-body-medium font-bold text-text-main">Jumlah Rak</label>
                      {isFixedOrderParams && (
                        <span className="text-[11px] text-neutral-400 font-medium">Sesuai filter pencarian</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, (typeof quantity === 'number' ? quantity : 0) - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-main hover:bg-bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={isFixedOrderParams || (typeof quantity === 'number' && quantity <= 1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        disabled={isFixedOrderParams}
                        readOnly={isFixedOrderParams}
                        onChange={(e) => {
                          if (isFixedOrderParams) return;
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
                        className={`w-20 h-10 text-center text-h3 rounded-md border ${
                          isOverStock
                            ? 'border-danger text-danger bg-red-50 focus:ring-danger'
                            : 'border-border focus:ring-primary-500'
                        } ${isFixedOrderParams ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed border-neutral-200' : ''} focus:outline-none focus:ring-2`}
                      />
                      <button
                        onClick={() => setQuantity((typeof quantity === 'number' ? quantity : 0) + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white text-text-main hover:bg-bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={isFixedOrderParams}
                      >
                        +
                      </button>
                    </div>
                    {isOverStock && (
                      <p className="text-xs text-danger mt-2 font-medium">
                        Stok tidak mencukupi. Sisa stok hari ini: {availableStock} rak.
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-body-medium font-bold text-text-main">
                        Metode Pengiriman
                      </label>
                    </div>
                    <div className="flex gap-4">
                      <label
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md border p-3 text-sm font-bold transition-colors ${
                          isFixedOrderParams || peternakDetail?.has_vehicle === false ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        } ${
                          method === 'pickup'
                            ? 'border-primary-400 bg-primary-50 text-primary-950'
                            : 'border-border bg-white text-text-main'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={method === 'pickup'}
                          onChange={() => !isFixedOrderParams && setMethod('pickup')}
                          disabled={isFixedOrderParams}
                          className="hidden"
                        />
                        Ambil Sendiri
                      </label>
                      {peternakDetail?.has_vehicle !== false && (
                        <label
                          className={`flex flex-1 items-center justify-center gap-2 rounded-md border p-3 text-sm font-bold transition-colors ${
                            isFixedOrderParams ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                          } ${
                            method === 'delivery'
                              ? 'border-primary-400 bg-primary-50 text-primary-950'
                              : 'border-border bg-white text-text-main'
                          }`}
                        >
                          <input
                            type="radio"
                            checked={method === 'delivery'}
                            onChange={() => !isFixedOrderParams && setMethod('delivery')}
                            disabled={isFixedOrderParams}
                            className="hidden"
                          />
                          Diantar
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="text-body-medium font-bold text-text-main block mb-2">
                      Slot Waktu Hari Ini
                    </label>
                    <select
                      className="w-full rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      disabled={isLoadingSlots || timeSlots.length === 0}
                    >
                      <option value="">
                        {isLoadingSlots
                          ? 'Memuat slot waktu...'
                          : timeSlots.length === 0
                          ? 'Tidak ada slot waktu aktif'
                          : 'Pilih Slot Waktu'}
                      </option>
                      {timeSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {method === 'delivery' && (
                    <div className="mb-6">
                      <label className="text-body-medium font-bold text-text-main block mb-2">
                        Alamat Pengiriman
                      </label>
                      {addresses.length === 0 ? (
                        <p className="text-sm text-danger">Belum ada alamat tersimpan.</p>
                      ) : (
                        <div className="space-y-2">
                          {addresses.map((addr) => (
                            <label
                              key={addr.id}
                              className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:border-primary-300"
                            >
                              <input
                                type="radio"
                                name="address"
                                className="mt-1 shrink-0"
                                checked={addressId === addr.id}
                                onChange={() => {
                                  setAddressId(addr.id);
                                  setConsumerAddress(addr);
                                }}
                              />
                              <div>
                                <p className="font-semibold text-text-main text-sm">
                                  {addr.label || 'Rumah'}
                                </p>
                                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                                  {addr.address}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-neutral-100 shrink-0 mt-auto">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="w-1/3"
                    disabled={isSubmitting}
                  >
                    Kembali
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleLanjut}
                    className="flex-1"
                    disabled={
                      isSubmitting ||
                      isOverStock ||
                      !quantity ||
                      !selectedSlot ||
                      (method === 'delivery' && !addressId)
                    }
                  >
                    {isSubmitting ? 'Memproses...' : 'Pesan Sekarang'}
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
