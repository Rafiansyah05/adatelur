'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, QrCode, Download, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/toast';

export default function CheckoutQrisPage() {
  const params = useParams();
  const orderId = Array.isArray(params.order_id) ? params.order_id[0] : (params.order_id as string);
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  const [order, setOrder] = useState<any>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [deeplinkUrl, setDeeplinkUrl] = useState<string | null>(null);
  const [isPublicUrl, setIsPublicUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(900);
  const [successCountdown, setSuccessCountdown] = useState(3);

  const markSuccess = () => {
    setIsSuccess(true);
    localStorage.removeItem(`qris_data_${orderId}`);
  };

  useEffect(() => {
    const supabase = supabaseRef.current;
    const cached = localStorage.getItem(`qris_data_${orderId}`);

    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.expiry > Date.now()) {
        setQrisUrl(parsed.qrisUrl);
        setQrString(parsed.qrString || null);
        setDeeplinkUrl(parsed.deeplinkUrl || null);
        setIsPublicUrl(!!parsed.isPublicUrl);
        setTimeLeft(Math.floor((parsed.expiry - Date.now()) / 1000));

        supabase
          .from('orders')
          .select('*, peternak:peternak_details(farm_name, farm_latitude, farm_longitude, profile:profiles(full_name))')
          .eq('id', orderId)
          .single()
          .then(({ data }) => {
            if (data) {
              setOrder(data);
              if (data.payment_status === 'paid') markSuccess();
            }
            setLoading(false);
          });
        return;
      }
      localStorage.removeItem(`qris_data_${orderId}`);
    }

    supabase
      .from('orders')
      .select('*, peternak:peternak_details(farm_name, farm_latitude, farm_longitude, profile:profiles(full_name))')
      .eq('id', orderId)
      .single()
      .then(async ({ data: orderData, error }) => {
        if (error || !orderData) {
          setErrorMsg('Pesanan tidak ditemukan');
          setLoading(false);
          return;
        }

        setOrder(orderData);

        if (orderData.payment_status === 'paid') {
          markSuccess();
          setLoading(false);
          return;
        }

        if (orderData.payment_status === 'failed' || orderData.order_status === 'dibatalkan') {
          router.push('/');
          return;
        }

        const res = await fetch('/api/payment/qris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId }),
        });
        const qrisData = await res.json();

        if (qrisData.error) {
          setErrorMsg(qrisData.error);
          setLoading(false);
          return;
        }

        setQrisUrl(qrisData.qris_url);
        setQrString(qrisData.qr_string);
        setDeeplinkUrl(qrisData.deeplink_url);
        setIsPublicUrl(!!qrisData.is_public_url);
        setTimeLeft(900);

        localStorage.setItem(
          `qris_data_${orderId}`,
          JSON.stringify({
            qrisUrl: qrisData.qris_url,
            qrString: qrisData.qr_string,
            deeplinkUrl: qrisData.deeplink_url,
            isPublicUrl: !!qrisData.is_public_url,
            expiry: Date.now() + 15 * 60 * 1000,
          })
        );

        setLoading(false);
      });
  }, [orderId, router]);

  useEffect(() => {
    if (!orderId) return;

    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`checkout_payment_${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new.payment_status === 'paid') {
            markSuccess();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (!qrisUrl || isSuccess) return;

    const poll = setInterval(async () => {
      const supabase = supabaseRef.current;

      const { data: orderRow } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('id', orderId)
        .single();

      if (orderRow?.payment_status === 'paid') {
        clearInterval(poll);
        markSuccess();
        return;
      }

      try {
        const res = await fetch('/api/payment/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId }),
        });
        const data = await res.json();
        if (data.status === 'paid') {
          clearInterval(poll);
          markSuccess();
        } else if (data.status === 'expired' || data.status === 'failed') {
          clearInterval(poll);
          localStorage.removeItem(`qris_data_${orderId}`);
          router.push('/');
        }
      } catch {}
    }, 3000);

    return () => clearInterval(poll);
  }, [qrisUrl, isSuccess, orderId, router]);

  useEffect(() => {
    if (isSuccess && successCountdown > 0) {
      const timer = setTimeout(() => setSuccessCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && successCountdown === 0) {
      router.replace('/orders');
    }
  }, [isSuccess, successCountdown, router]);

  useEffect(() => {
    if (!qrisUrl || isSuccess) return;
    if (timeLeft <= 0) {
      localStorage.removeItem(`qris_data_${orderId}`);
      setQrisUrl(null);
      fetch('/api/payment/expire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      }).finally(() => router.push('/'));
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, qrisUrl, isSuccess, orderId, router]);

  const handleDownloadQris = () => {
    if (!qrisUrl) return;
    try {
      const proxyUrl = isPublicUrl ? qrisUrl : `/api/payment/qris-image?url=${encodeURIComponent(qrisUrl)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.setAttribute('download', `QRIS_Adatelur_${orderId}.png`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      showToast('Gagal mengunduh QRIS. Silakan screenshot layar ini.', 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="bg-white p-8 rounded-lg border border-neutral-100 text-center max-w-sm">
          <div className="text-red-500 mb-4 flex justify-center">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-text-main">Terjadi Kesalahan</h2>
          <p className="text-neutral-500 mb-6">{errorMsg}</p>
          <Button onClick={() => router.push('/')} variant="primary" className="w-full">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="bg-white p-8 rounded-lg border border-neutral-100 text-center max-w-sm w-full">
          <div className="h-20 w-20 bg-success-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-text-main">Pembayaran Berhasil</h2>
          <p className="text-neutral-500 mb-2">Pesanan Anda berhasil dibuat.</p>
          <p className="text-neutral-500 mb-8">
            Anda akan diarahkan ke Riwayat Pesanan dalam <br />
            <span className="text-primary-600 font-bold text-xl">{successCountdown}</span> detik
          </p>
          <Button onClick={() => router.replace('/orders')} variant="primary" className="w-full">
            Lihat Sekarang
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = Number(order?.subtotal ?? 0);
  const ongkir = Number(order?.ongkir_amount ?? 0);
  const totalBarang = subtotal + ongkir;
  const biayaLayanan = Math.round(totalBarang * 0.015);
  const totalAkhir = totalBarang + biayaLayanan;

  const peternakDisplayName = order?.peternak?.farm_name || order?.peternak?.profile?.full_name || 'Peternak Ada Telur';

  const handleOpenMap = () => {
    if (order?.peternak?.farm_latitude && order?.peternak?.farm_longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${order.peternak.farm_latitude},${order.peternak.farm_longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 h-16 flex items-center shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors mr-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-neutral-900">Detail Pembayaran</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-lg border border-neutral-100 p-6">
            <h2 className="text-lg font-bold text-text-main mb-4">Informasi Pesanan</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-lg">
                {peternakDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-text-main">{peternakDisplayName}</p>
                <p className="text-sm text-neutral-500">
                  Metode: <span className="font-semibold uppercase">{order?.fulfillment_method}</span>
                </p>
              </div>
            </div>

            {order?.fulfillment_method === 'pickup' && (
              <Button onClick={handleOpenMap} variant="outline" className="w-full flex items-center justify-center gap-2 mb-6">
                <MapPin className="h-4 w-4" /> Lihat Lokasi Peternak
              </Button>
            )}

            <div className="space-y-3 pt-6 border-t border-neutral-100">
              <h3 className="font-semibold text-text-main text-sm">Rincian Harga</h3>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Telur ({order?.rak_quantity} Rak)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Ongkos Kirim</span>
                <span>Rp {ongkir.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Biaya Layanan</span>
                <span>Rp {biayaLayanan.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-text-main pt-3 border-t border-neutral-100">
                <span>Total Pembayaran</span>
                <span>Rp {totalAkhir.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-lg border border-neutral-100 p-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 text-primary-600 font-bold mb-2">
              <QrCode className="h-5 w-5" />
              <span>QRIS Pembayaran</span>
            </div>
            <p className="text-sm text-neutral-500 mb-6">Pindai kode QR ini menggunakan aplikasi e-wallet atau m-banking Anda.</p>

            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mb-6">
              {qrisUrl ? (
                <div className="relative w-56 h-56 mx-auto bg-white rounded-lg p-2 border border-neutral-100 flex items-center justify-center">
                  <img
                    src={isPublicUrl ? qrisUrl : `/api/payment/qris-image?url=${encodeURIComponent(qrisUrl)}`}
                    alt="QRIS Payment"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 mx-auto bg-neutral-100 animate-pulse rounded-lg"></div>
              )}
            </div>

            <div className="flex items-center gap-2 text-danger font-semibold bg-red-50 px-4 py-2 rounded-lg mb-6">
              <Clock className="h-4 w-4" />
              <span>Sisa Waktu: {formatTime(timeLeft)}</span>
            </div>

            <Button onClick={handleDownloadQris} disabled={!qrisUrl} className="w-full flex items-center justify-center gap-2 mb-4">
              <Download className="h-4 w-4" /> Simpan ke Galeri
            </Button>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 text-left w-full mt-4">
              <div className="text-xs text-blue-800 leading-relaxed">
                <p className="font-semibold mb-1">Simulasi Pembayaran (Sandbox)</p>
                <p>
                  Platform ini menggunakan Midtrans Sandbox untuk keperluan pengujian. Silakan gunakan link di bawah ini untuk mensimulasikan keberhasilan pembayaran:
                </p>
                <div className="flex flex-col gap-2 mt-3">
                  <a
                    href="https://simulator.sandbox.midtrans.com/qris/index"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-bold underline hover:text-blue-900"
                  >
                    Buka QRIS Simulator
                  </a>
                  {qrString && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(qrString);
                        showToast('Teks QR berhasil disalin! Silakan paste (tempel) di Midtrans Simulator.', 'success');
                      }}
                      className="inline-block text-left text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Salin Teks QR (Untuk Simulator)
                    </button>
                  )}
                  {deeplinkUrl && (
                    <a
                      href={deeplinkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-left text-sm font-bold text-blue-600 hover:text-blue-800 mt-2"
                    >
                      Buka GoPay Simulator Langsung (Otomatis)
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
