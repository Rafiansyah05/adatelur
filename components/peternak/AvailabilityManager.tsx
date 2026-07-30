'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ToggleLeft, ToggleRight, Store, Package, Clock, Tag, X, AlertCircle } from 'lucide-react';

const sessionBlocks = [
  '00:00 - 03:00',
  '03:00 - 06:00',
  '06:00 - 09:00',
  '09:00 - 12:00',
  '12:00 - 15:00',
  '15:00 - 18:00',
  '18:00 - 21:00',
  '21:00 - 23:59',
];

interface ListingRecord {
  id?: string;
  price_per_rak: number;
  stock_rak: number;
  remaining_stock?: number;
  is_listing_active: boolean;
  listing_date: string;
}

interface DeliverySlotRecord {
  id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityManagerProps {
  initialListing: ListingRecord | null;
  initialSlots: DeliverySlotRecord[];
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AvailabilityManager({ initialListing, initialSlots }: AvailabilityManagerProps) {
  const initialActiveSessions = initialSlots
    .filter((slot) => slot.is_active)
    .map((slot) => {
      const start = slot.start_time.substring(0, 5);
      const end = slot.end_time.substring(0, 5);
      return `${start} - ${end}`;
    });

  const [activeSessions, setActiveSessions] = React.useState<string[]>(initialActiveSessions);

  const [currentStock, setCurrentStock] = React.useState<number>(
    initialListing?.remaining_stock ?? initialListing?.stock_rak ?? 0
  );
  const [currentPrice, setCurrentPrice] = React.useState<number>(
    initialListing?.price_per_rak ?? 0
  );

  const [pricePerRak, setPricePerRak] = React.useState('');
  const [stockRak, setStockRak] = React.useState('');

  const [confirmType, setConfirmType] = React.useState<'price' | 'stock' | null>(null);
  const [isSavingListing, setIsSavingListing] = React.useState(false);
  const [isSyncingSlots, setIsSyncingSlots] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'listing' | 'sesi'>('listing');

  React.useEffect(() => {
    setCurrentStock(initialListing?.remaining_stock ?? initialListing?.stock_rak ?? 0);
    setCurrentPrice(initialListing?.price_per_rak ?? 0);
  }, [initialListing]);

  const parsedPrice = Number(pricePerRak);
  const parsedStock = Number(stockRak);

  const isPriceValid =
    pricePerRak.trim() !== '' &&
    Number.isFinite(parsedPrice) &&
    parsedPrice > 0;

  const isStockValid =
    stockRak.trim() !== '' &&
    Number.isFinite(parsedStock) &&
    parsedStock > 0 &&
    (currentPrice > 0 || isPriceValid);

  const handleOpenConfirmPrice = () => {
    if (!isPriceValid) return;
    setMessage('');
    setConfirmType('price');
  };

  const handleOpenConfirmStock = () => {
    if (!isStockValid) return;
    setMessage('');
    setConfirmType('stock');
  };

  const handleSavePrice = async () => {
    if (!isPriceValid) return;
    setIsSavingListing(true);
    setMessage('');

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_rak: parsedPrice,
          stock_rak: currentStock,
          is_listing_active: initialListing?.is_listing_active ?? false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan harga');
      }

      setCurrentPrice(parsedPrice);
      setPricePerRak('');
      setConfirmType(null);
      setMessage('Harga per rak berhasil disimpan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsSavingListing(false);
    }
  };

  const handleSaveStock = async () => {
    if (!isStockValid) return;
    setIsSavingListing(true);
    setMessage('');

    const newStock = currentStock + parsedStock;
    const priceToUse = currentPrice > 0 ? currentPrice : parsedPrice;

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_rak: priceToUse,
          stock_rak: newStock,
          is_listing_active: initialListing?.is_listing_active ?? false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan stok');
      }

      setCurrentStock(newStock);
      if (priceToUse !== currentPrice) {
        setCurrentPrice(priceToUse);
      }
      setStockRak('');
      setConfirmType(null);
      setMessage('Stok rak berhasil disimpan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsSavingListing(false);
    }
  };

  const handleToggleSession = async (sessionStr: string) => {
    setIsSyncingSlots(true);
    setMessage('');

    let newSessions = [...activeSessions];
    if (newSessions.includes(sessionStr)) {
      newSessions = newSessions.filter((session) => session !== sessionStr);
    } else {
      newSessions.push(sessionStr);
    }

    try {
      const response = await fetch('/api/delivery-slots/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSlots: newSessions }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan sesi waktu');
      }

      setActiveSessions(newSessions);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan sesi');
    } finally {
      setIsSyncingSlots(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4 mb-6">
        <Card className="p-3.5 md:p-5">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <span className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Store className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-bold text-text-desc uppercase tracking-wide truncate">Status Toko</p>
              <p className={`text-base sm:text-lg md:text-2xl font-black truncate ${initialListing?.is_listing_active ? 'text-success-text' : 'text-text-desc'}`}>
                {initialListing?.is_listing_active ? 'Buka' : 'Tutup'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3.5 md:p-5">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <span className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Package className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-bold text-text-desc uppercase tracking-wide truncate">Stok Rak</p>
              <p className="text-base sm:text-lg md:text-2xl font-black text-text-main truncate">{currentStock}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3.5 md:p-5">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <span className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-bold text-text-desc uppercase tracking-wide truncate">Slot Aktif</p>
              <p className="text-base sm:text-lg md:text-2xl font-black text-text-main truncate">{activeSessions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3.5 md:p-5">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <span className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Tag className="h-4 w-4 md:h-5 md:w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-bold text-text-desc uppercase tracking-wide truncate">Harga per Rak</p>
              <p className="text-base sm:text-lg md:text-2xl font-black text-text-main truncate">
                {currentPrice > 0 ? formatRupiah(currentPrice) : '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {message ? (
        <Card className="border-primary-400 bg-primary-50 p-3.5 md:p-4 text-xs md:text-sm font-semibold text-text-main mb-6">
          {message}
        </Card>
      ) : null}

      <div className="md:hidden flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('listing')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'listing' ? 'border-primary-500 text-primary-950' : 'border-transparent text-text-desc'
          }`}
        >
          Listing Hari Ini
        </button>
        <button
          onClick={() => setActiveTab('sesi')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'sesi' ? 'border-primary-500 text-primary-950' : 'border-transparent text-text-desc'
          }`}
        >
          Sesi Waktu
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Card className={`flex flex-col gap-4 md:gap-5 p-4 md:p-6 h-fit ${activeTab !== 'listing' ? 'hidden md:flex' : ''}`}>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-text-main mb-0.5 md:mb-1">Listing Hari Ini</h2>
            <p className="text-xs md:text-sm text-text-desc font-medium">Atur harga dan stok harian.</p>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label className="font-bold text-xs md:text-sm">Harga per rak</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={pricePerRak ? `Rp ${new Intl.NumberFormat('id-ID').format(Number(pricePerRak))}` : ''}
                  onChange={(event) => {
                    const rawValue = event.target.value.replace(/\D/g, '');
                    const sanitized = rawValue.replace(/^0+(?!$)/, '');
                    setPricePerRak(sanitized);
                  }}
                  placeholder="Rp 35.000"
                  className="font-semibold text-xs md:text-sm flex-1"
                />
                <Button
                  type="button"
                  onClick={handleOpenConfirmPrice}
                  disabled={!isPriceValid || isSavingListing}
                  className="font-bold text-xs md:text-sm py-2.5 px-4 shrink-0"
                >
                  Simpan Harga
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="font-bold text-xs md:text-sm">Stok rak (tersedia)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={stockRak}
                  onChange={(event) => {
                    const rawValue = event.target.value.replace(/\D/g, '');
                    const sanitized = rawValue.replace(/^0+(?!$)/, '');
                    setStockRak(sanitized);
                  }}
                  placeholder="Contoh: 20"
                  className="font-semibold text-xs md:text-sm flex-1"
                />
                <Button
                  type="button"
                  onClick={handleOpenConfirmStock}
                  disabled={!isStockValid || isSavingListing}
                  className="font-bold text-xs md:text-sm py-2.5 px-4 shrink-0"
                >
                  Simpan Stok
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className={`flex flex-col gap-4 md:gap-5 p-4 md:p-6 ${activeTab !== 'sesi' ? 'hidden md:flex' : ''}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-text-main mb-0.5 md:mb-1">Sesi Ketersediaan</h2>
              <p className="text-xs md:text-sm text-text-desc font-medium">Pilih sesi jam operasional Anda.</p>
            </div>
            {isSyncingSlots && (
              <span className="text-[10px] md:text-xs font-bold text-primary-700 animate-pulse bg-primary-50 px-2 py-1 rounded">
                Menyimpan...
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {sessionBlocks.map((session) => {
              const isActive = activeSessions.includes(session);
              return (
                <div
                  key={session}
                  className={`flex items-center justify-between rounded-md border px-3.5 py-2.5 md:px-4 md:py-3 cursor-pointer transition-colors ${
                    isActive ? 'border-primary-200 bg-primary-50' : 'border-border hover:bg-bg-surface'
                  }`}
                  onClick={() => !isSyncingSlots && handleToggleSession(session)}
                >
                  <div>
                    <p className="text-xs md:text-sm text-text-main font-bold">Sesi {session}</p>
                    <p className={`text-[10px] md:text-xs font-semibold ${isActive ? 'text-success-text' : 'text-text-desc'}`}>
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 focus:outline-none"
                    aria-label={`Toggle sesi ${session}`}
                  >
                    {isActive ? (
                      <ToggleRight className="h-7 w-7 md:h-8 md:w-8 text-success" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 md:h-8 md:w-8 text-text-desc" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {confirmType !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-md w-full max-w-sm md:max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-3.5 md:p-4 border-b border-neutral-100">
              <h3 className="font-bold text-base md:text-lg text-text-main">
                {confirmType === 'price' ? 'Konfirmasi Simpan Harga' : 'Konfirmasi Simpan Stok'}
              </h3>
              <button
                onClick={() => setConfirmType(null)}
                className="p-1 hover:bg-neutral-100 rounded-md transition-colors"
                disabled={isSavingListing}
              >
                <X className="h-5 w-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-4 md:p-6 flex flex-col gap-3.5 md:gap-4">
              {confirmType === 'price' ? (
                <p className="text-xs md:text-sm text-text-main font-medium leading-relaxed">
                  Apakah Anda yakin ingin mengatur harga per rak menjadi <span className="font-bold text-primary-950">{formatRupiah(parsedPrice)}</span>?
                </p>
              ) : (
                <>
                  <p className="text-xs md:text-sm text-text-main font-medium leading-relaxed">
                    Apakah Anda yakin ingin menambah stok sebanyak <span className="font-bold text-primary-950">{parsedStock} rak</span>?
                  </p>
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center gap-2.5 md:gap-3">
                    <AlertCircle className="h-5 w-5 text-primary-700 shrink-0" />
                    <p className="text-xs md:text-sm font-semibold text-text-main">
                      Stok rak Anda akan menjadi <span className="font-black text-primary-800 text-sm md:text-base">{currentStock + parsedStock} rak</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-3.5 md:p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-2.5 md:gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmType(null)}
                disabled={isSavingListing}
                className="font-semibold text-xs md:text-sm px-3 md:px-4 py-2"
              >
                Batal
              </Button>
              <Button
                onClick={confirmType === 'price' ? handleSavePrice : handleSaveStock}
                disabled={isSavingListing}
                className="font-bold text-xs md:text-sm px-3 md:px-4 py-2"
              >
                {isSavingListing ? 'Menyimpan...' : 'Ya, Simpan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
