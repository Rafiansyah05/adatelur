'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/toast';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  peternakId: string;
  peternakName: string;
  rakQuantity: number;
  method: 'pickup' | 'delivery';
  pricePerRak: number;
  estimatedOngkir: number;
  listingId: string;
}

export function OrderModal({
  isOpen,
  onClose,
  peternakId,
  peternakName,
  rakQuantity,
  method,
  pricePerRak,
  estimatedOngkir,
  listingId
}: OrderModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [addressId, setAddressId] = useState<string>('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'initial' | 'waiting' | 'cancelled'>('initial');
  const [timeLeft, setTimeLeft] = useState(300);
  const [orderId, setOrderId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const [timeSlots, setTimeSlots] = useState<{ id: string; label: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [availableStock, setAvailableStock] = useState<number | null>(null);

  const [localRak, setLocalRak] = useState<number | ''>(rakQuantity || '');
  const [localMethod, setLocalMethod] = useState<'pickup' | 'delivery'>(method);

  useEffect(() => {
    if (isOpen) {
      setLocalRak(rakQuantity || '');
      setLocalMethod(method || 'pickup');
    }
  }, [isOpen, rakQuantity, method]);

  useEffect(() => {
    if (isOpen) {
      const fetchDetail = async () => {
        setIsLoadingSlots(true);
        try {
          const res = await fetch(`/api/peternak/${peternakId}`).then((r) => r.json());
          if (res.data) {
            const remStock = Math.max(0, (res.data.stock_rak || 0) - (res.data.sold_rak_today || 0));
            setAvailableStock(remStock);

            if (res.data.delivery_slots && Array.isArray(res.data.delivery_slots) && res.data.delivery_slots.length > 0) {
              const formattedSlots = res.data.delivery_slots.map((slot: any) => ({
                id: slot.id,
                label: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`
              }));
              setTimeSlots(formattedSlots);
              setSelectedSlot(formattedSlots[0].id);
            } else {
              setTimeSlots([]);
              setSelectedSlot('');
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingSlots(false);
        }
      };

      fetchDetail();

      if (localMethod === 'delivery') {
        const fetchAddresses = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase.from('consumer_addresses').select('*').eq('profile_id', user.id);
            if (data && data.length > 0) {
              setAddresses(data);
              setAddressId(data[0].id);
            }
          }
        };
        fetchAddresses();
      }
    }
  }, [isOpen, localMethod, peternakId, supabase]);

  const handleLanjut = async () => {
    if (!localRak || localRak < 1) return showToast('Silakan masukkan jumlah rak yang valid!', 'error');
    if (availableStock !== null && localRak > availableStock) return showToast('Sisa stok hari ini tidak mencukupi!', 'error');
    if (!selectedSlot) return showToast('Silakan pilih slot waktu!', 'error');
    if (localMethod === 'delivery' && !addressId) return showToast('Silakan pilih alamat pengiriman!', 'error');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          rakQuantity: localRak,
          fulfillmentMethod: localMethod,
          consumerAddressId: localMethod === 'delivery' ? addressId : null,
          deliverySlotId: selectedSlot || null,
        })
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

  const handleCancel = async () => {
    if (orderId) {
      await fetch(`/api/orders/${orderId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
    }
    onClose();
  };

  const handleTimeout = async () => {
    setOrderStatus('cancelled');
    if (orderId) {
      await fetch(`/api/orders/${orderId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
    }
    setTimeout(() => {
      onClose();
      window.dispatchEvent(new CustomEvent('remove-peternak-recommendation', { detail: peternakId }));
    }, 4000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-text-main mb-1">Pesan dari {peternakName}</h2>
          <p className="text-sm text-neutral-500 mb-6">Sesuaikan pesanan Anda di bawah ini.</p>

          <div className="space-y-5 mb-6 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-semibold text-text-main mb-2">Slot Waktu Hari Ini</label>
              <select
                className="w-full rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                disabled={isLoadingSlots || timeSlots.length === 0}
              >
                <option value="">
                  {isLoadingSlots ? 'Memuat slot waktu...' : (timeSlots.length === 0 ? 'Tidak ada slot waktu aktif' : 'Pilih Slot Waktu')}
                </option>
                {timeSlots.map(slot => (
                  <option key={slot.id} value={slot.id}>{slot.label}</option>
                ))}
              </select>
            </div>

            {localMethod === 'delivery' && (
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">Alamat Pengiriman</label>
                {addresses.length === 0 ? (
                  <p className="text-sm text-danger">Belum ada alamat tersimpan.</p>
                ) : (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-500 mb-1">
                        Pesanan akan diantar ke:
                      </p>
                      <p className="text-sm font-semibold text-text-main leading-relaxed">
                        {addresses.find(a => a.id === addressId)?.full_address || addresses.find(a => a.id === addressId)?.address || addresses[0]?.full_address || addresses[0]?.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-100">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleLanjut}
              disabled={isSubmitting || !localRak || !selectedSlot || (localMethod === 'delivery' && !addressId) || (availableStock !== null && localRak > availableStock)}
              className="flex-1 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
