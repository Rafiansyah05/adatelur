'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CameraCapture } from '@/components/CameraCapture';
import { MapPin, MessageCircle, Package, Truck, ShoppingBag, Clock, User, ArrowLeft } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

export interface OrderDetailData {
  id: string;
  order_status: string;
  payment_status: string;
  fulfillment_method: string;
  rak_quantity: number;
  price_per_rak: number;
  subtotal: number;
  ongkir_amount: number;
  total_amount: number;
  created_at: string;
  consumer?: { full_name: string; phone_number: string } | null;
  consumer_address?: { full_address: string; latitude: number; longitude: number } | null;
  delivery_slot?: { start_time: string; end_time: string } | null;
}

const statusLabels: Record<string, string> = {
  waiting: 'Menunggu Konfirmasi',
  accepted: 'Diproses',
  processing: 'Diproses',
  in_delivery: 'Sedang Diantar',
  completed: 'Selesai',
  rejected: 'Ditolak',
  expired: 'Kadaluarsa',
  cancelled: 'Dibatalkan',
};

function statusBadgeClass(status: string) {
  if (status === 'completed' || status === 'in_delivery') {
    return 'bg-success-bg text-success-text border border-success';
  }
  if (['rejected', 'expired', 'cancelled'].includes(status)) {
    return 'bg-danger-light text-danger-text border border-danger';
  }
  return 'bg-primary-50 text-primary-700 border border-primary-200';
}

function formatRupiah(value: number) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatWaNumber(phone: string) {
  if (!phone) return '';
  return phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        {icon}
      </span>
      <h2 className="text-h3 text-text-main">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-body text-text-desc">{label}</span>
      <span className="text-body-medium text-text-main text-right">{value}</span>
    </div>
  );
}

export function OrderDetail({ order }: { order: OrderDetailData }) {
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const status = order.order_status;
  const isPaid = order.payment_status === 'paid';
  const isDelivery = order.fulfillment_method === 'delivery';
  const isActive = ['accepted', 'processing'].includes(status);
  const isTerminal = ['completed', 'rejected', 'cancelled', 'expired'].includes(status);
  const consumerPhone = order.consumer?.phone_number || '';

  const [locationData, setLocationData] = React.useState<{ lat: number; lng: number } | null>(null);

  const markDelivering = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_delivery' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal memperbarui status');
      }
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Terjadi kesalahan', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const completeWithPhoto = async () => {
    if (!photo) return;
    setIsUploading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_base64: photo,
          latitude: locationData?.lat,
          longitude: locationData?.lng,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyelesaikan pesanan');
      }
      setIsCameraOpen(false);
      setPhoto(null);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Terjadi kesalahan', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = () => {
    setPhoto(null);
    setIsCameraOpen(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationData({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => { }
      );
    }
  };

  const contactWhatsApp = () => {
    window.open(`https://wa.me/${formatWaNumber(consumerPhone)}`, '_blank');
  };

  const viewLocation = () => {
    if (!order.consumer_address) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${order.consumer_address.latitude},${order.consumer_address.longitude}`,
      '_blank'
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/orders')}
            className="mt-1 hidden md:flex shrink-0 items-center justify-center rounded-full p-2 hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-text-main" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Detail Pesanan</h1>
            <p className="text-caption text-text-desc mt-1">
              Order #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-caption font-semibold ${statusBadgeClass(status)}`}>
          {statusLabels[status] || status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="space-y-6 p-6">
            <div className="space-y-4">
              <SectionHeader icon={<User className="h-4 w-4" />} title="Konsumen" />
              <div>
                <InfoRow label="Nama" value={order.consumer?.full_name || 'Konsumen'} />
                <div className="flex items-start justify-between gap-4 py-1.5">
                  <span className="text-body text-text-desc">No. WhatsApp</span>
                  {consumerPhone ? (
                    <button
                      type="button"
                      onClick={contactWhatsApp}
                      className="text-body-medium text-primary-700 text-right hover:underline"
                    >
                      {consumerPhone}
                    </button>
                  ) : (
                    <span className="text-body-medium text-text-main">-</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <SectionHeader icon={<Package className="h-4 w-4" />} title="Rincian Pesanan" />
              <div>
                <InfoRow label="Jumlah" value={`${order.rak_quantity} rak`} />
                <div className="flex items-center justify-between gap-4 py-1.5">
                  <span className="text-body text-text-desc">Metode</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold ${isDelivery
                        ? 'bg-success-bg text-success-text border border-success'
                        : 'bg-primary-50 text-primary-700 border-primary-200'
                      }`}
                  >
                    {isDelivery ? <><Truck className="h-3 w-3" /> Diantar</> : <><ShoppingBag className="h-3 w-3" /> Ambil Sendiri</>}
                  </span>
                </div>
                {order.delivery_slot ? (
                  <InfoRow
                    label={isDelivery ? 'Jam antar' : 'Jam ambil'}
                    value={`${order.delivery_slot.start_time.substring(0, 5)} - ${order.delivery_slot.end_time.substring(0, 5)} WIB`}
                  />
                ) : null}
                {isDelivery && order.consumer_address ? (
                  <InfoRow label="Alamat" value={order.consumer_address.full_address} />
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="space-y-4 p-6 lg:sticky lg:top-24">
            <h2 className="text-h3 text-text-main">Ringkasan</h2>
            <div>
              <InfoRow label={`Telur (${order.rak_quantity} rak)`} value={formatRupiah(order.subtotal)} />
              <InfoRow label="Ongkir" value={formatRupiah(order.ongkir_amount)} />
              <div className="flex items-center justify-between gap-4 py-1.5">
                <span className="text-body text-text-desc">Pembayaran</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${isPaid
                      ? 'bg-success-bg text-success-text border border-success'
                      : 'bg-primary-100 text-primary-700 border border-primary-200'
                    }`}
                >
                  {isPaid ? 'Lunas' : 'Belum dibayar'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-body-medium text-text-main">Total</span>
              <span className="text-h2 text-text-main">{formatRupiah(order.total_amount)}</span>
            </div>

            {!isTerminal ? (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                {isPaid && consumerPhone ? (
                  <Button variant="outline" onClick={contactWhatsApp} className="w-full flex items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4 text-success" /> Hubungi WA
                  </Button>
                ) : null}

                {isDelivery && order.consumer_address ? (
                  <Button variant="outline" onClick={viewLocation} className="w-full flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" /> Lihat Lokasi
                  </Button>
                ) : null}

                {isPaid && isDelivery && isActive ? (
                  <Button onClick={markDelivering} disabled={isUpdating} className="w-full flex items-center justify-center gap-2">
                    <Truck className="h-4 w-4" /> {isUpdating ? 'Memproses...' : 'Diantar'}
                  </Button>
                ) : null}

                {isPaid && isDelivery && status === 'in_delivery' ? (
                  <Button onClick={openCamera} className="w-full flex items-center justify-center gap-2">
                    <Package className="h-4 w-4" /> Diterima
                  </Button>
                ) : null}

                {isPaid && !isDelivery && isActive ? (
                  <Button onClick={openCamera} className="w-full flex items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4" /> Diserahkan ke Pembeli
                  </Button>
                ) : null}

                {!isPaid ? (
                  <div className="flex items-center gap-2 text-caption text-text-desc">
                    <Clock className="h-4 w-4" /> Menunggu pembayaran konsumen
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      {isCameraOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md">
            <CameraCapture
              label="Bukti Pengiriman"
              onCapture={(image) => setPhoto(image)}
              nextButton={
                <Button
                  onClick={completeWithPhoto}
                  disabled={!photo || isUploading}
                  className="w-full min-h-12"
                >
                  {isUploading ? 'Mengunggah...' : 'Selesaikan'}
                </Button>
              }
            />
            <button
              type="button"
              onClick={() => setIsCameraOpen(false)}
              className="mt-3 w-full text-center text-sm font-semibold text-white"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
