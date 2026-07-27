'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [orderId, setOrderId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const [timeSlots, setTimeSlots] = useState<{id: string; label: string}[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        const { data, error } = await supabase
          .from('delivery_slots')
          .select('id, start_time, end_time')
          .eq('peternak_id', peternakId)
          .eq('is_active', true)
          .order('start_time', { ascending: true });
          
        if (data) {
          const formattedSlots = data.map(slot => ({
            id: slot.id,
            label: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`
          }));
          setTimeSlots(formattedSlots);
          if (formattedSlots.length > 0) setSelectedSlot(formattedSlots[0].id);
        }
        setIsLoadingSlots(false);
      };
      fetchSlots();
      
      if (method === 'delivery') {
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
  }, [isOpen, method, peternakId, supabase]);

  // Real-time subscription handled by GlobalWaitingModal now

  const handleLanjut = async () => {
    if (!selectedSlot) return alert('Silakan pilih slot waktu!');
    if (method === 'delivery' && !addressId) return alert('Silakan pilih alamat pengiriman!');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          rakQuantity,
          fulfillmentMethod: method,
          consumerAddressId: method === 'delivery' ? addressId : null,
          deliverySlotId: selectedSlot || null, // ID slot dari delivery_slots
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Notify global modal to check for new order
      window.dispatchEvent(new CustomEvent('new-order-created', { detail: data.data.id }));
      onClose(); // Close this modal, let global modal take over
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (orderId) {
      // Opt-in cancel
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
    // Remove from UI after a few seconds
    setTimeout(() => {
      onClose();
      // Inform parent to remove peternak from recommendations
      // We can dispatch an event or use context. For now, page reload or simple close is enough.
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
            <p className="text-sm text-neutral-500 mb-6">Pilih waktu {method === 'pickup' ? 'pengambilan' : 'pengiriman'} pesanan Anda.</p>

            <div className="space-y-4 mb-6">
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

              {method === 'delivery' && (
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-2">Alamat Pengiriman</label>
                  {addresses.length === 0 ? (
                    <p className="text-sm text-danger">Belum ada alamat tersimpan.</p>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map(addr => (
                        <label key={addr.id} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:border-primary-300">
                          <input 
                            type="radio" 
                            name="address" 
                            className="mt-1"
                            checked={addressId === addr.id}
                            onChange={() => setAddressId(addr.id)}
                          />
                          <div>
                            <p className="font-semibold text-text-main text-sm">{addr.label || 'Rumah'}</p>
                            <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{addr.address}</p>
                          </div>
                        </label>
                      ))}
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
                disabled={isSubmitting || !selectedSlot || (method === 'delivery' && !addressId)}
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
