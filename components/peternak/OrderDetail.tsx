'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CameraCapture } from '@/components/CameraCapture';
import { MapPin, MessageCircle, Package, Truck, ShoppingBag, Clock, User } from 'lucide-react';

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

const STATUS_LABELS: Record<string, string> = {
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
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
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan');
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
        body: JSON.stringify({ photo_base64: photo }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyelesaikan pesanan');
      }
      setIsCameraOpen(false);
      setPhoto(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = () => {
    setPhoto(null);
    setIsCameraOpen(true);
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
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-main">Detail Pesanan</h1>
          <p className="text-caption text-text-desc mt-1">
            {new Date(order.created_at).toLocaleString('id-ID')}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-caption font-semibold ${statusBadgeClass(status)}`}
        >
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-text-desc" />
          <h2 className="text-h3 text-text-main">Konsumen</h2>
        </div>
        <div>
          <InfoRow label="Nama" value={order.consumer?.full_name || 'Konsumen'} />
          <InfoRow label="No. WhatsApp" value={consumerPhone || '-'} />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-text-desc" />
          <h2 className="text-h3 text-text-main">Rincian Pesanan</h2>
        </div>
        <div>
          <InfoRow label="Jumlah" value={`${order.rak_quantity} rak`} />
          <InfoRow
            label="Metode"
            value={isDelivery ? 'Diantar' : 'Ambil Sendiri'}
          />
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
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-h3 text-text-main">Rincian Harga</h2>
        <div>
          <InfoRow
            label={`Telur (${order.rak_quantity} rak)`}
            value={formatRupiah(order.subtotal)}
          />
          <InfoRow label="Ongkir" value={formatRupiah(order.ongkir_amount)} />
          <InfoRow
            label="Pembayaran"
            value={isPaid ? 'Lunas' : 'Belum dibayar'}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-body-medium text-text-main">Total</span>
          <span className="text-h3 text-text-main">{formatRupiah(order.total_amount)}</span>
        </div>
      </Card>

      {!isTerminal ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {isPaid && consumerPhone ? (
            <Button variant="outline" onClick={contactWhatsApp} className="flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4 text-success" /> Hubungi WA
            </Button>
          ) : null}

          {isDelivery && order.consumer_address ? (
            <Button variant="outline" onClick={viewLocation} className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" /> Lihat Lokasi
            </Button>
          ) : null}

          {isPaid && isDelivery && isActive ? (
            <Button onClick={markDelivering} disabled={isUpdating} className="flex items-center justify-center gap-2">
              <Truck className="h-4 w-4" /> {isUpdating ? 'Memproses...' : 'Diantar'}
            </Button>
          ) : null}

          {isPaid && isDelivery && status === 'in_delivery' ? (
            <Button onClick={openCamera} className="flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> Diterima
            </Button>
          ) : null}

          {isPaid && !isDelivery && isActive ? (
            <Button onClick={openCamera} className="flex items-center justify-center gap-2">
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
                  className="w-full min-h-[52px]"
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
