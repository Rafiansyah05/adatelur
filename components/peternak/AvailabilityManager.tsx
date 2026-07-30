'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ToggleLeft, ToggleRight, Store, Package, Clock, Tag } from 'lucide-react';

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

export function AvailabilityManager({ initialListing, initialSlots }: AvailabilityManagerProps) {
  const initialActiveSessions = initialSlots
    .filter((slot) => slot.is_active)
    .map((slot) => {
      const start = slot.start_time.substring(0, 5);
      const end = slot.end_time.substring(0, 5);
      return `${start} - ${end}`;
    });

  const [activeSessions, setActiveSessions] = React.useState<string[]>(initialActiveSessions);

  const [pricePerRak, setPricePerRak] = React.useState(
    initialListing?.price_per_rak ? initialListing.price_per_rak.toString().replace(/^0+(?!$)/, '') : ''
  );
  const [stockRak, setStockRak] = React.useState(
    initialListing?.stock_rak !== undefined && initialListing?.stock_rak !== null
      ? initialListing.stock_rak.toString().replace(/^0+(?!$)/, '')
      : ''
  );

  const [isSavingListing, setIsSavingListing] = React.useState(false);
  const [isSyncingSlots, setIsSyncingSlots] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'listing' | 'sesi'>('listing');

  React.useEffect(() => {
    setPricePerRak(
      initialListing?.price_per_rak ? initialListing.price_per_rak.toString().replace(/^0+(?!$)/, '') : ''
    );
    setStockRak(
      initialListing?.stock_rak !== undefined && initialListing?.stock_rak !== null
        ? initialListing.stock_rak.toString().replace(/^0+(?!$)/, '')
        : ''
    );
  }, [initialListing]);

  const handleSaveListing = async () => {
    setIsSavingListing(true);
    setMessage('');

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_rak: Number(pricePerRak),
          stock_rak: Number(stockRak),
          is_listing_active: initialListing?.is_listing_active ?? false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan listing');
      }

      setMessage('Listing harian berhasil disimpan.');
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <p className="text-caption text-text-desc">Status Toko</p>
              <p className={`text-h2 ${initialListing?.is_listing_active ? 'text-success-text' : 'text-text-desc'}`}>
                {initialListing?.is_listing_active ? 'Buka' : 'Tutup'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <p className="text-caption text-text-desc">Stok Rak</p>
              <p className="text-h2 text-text-main">{stockRak || '0'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-caption text-text-desc">Slot Aktif</p>
              <p className="text-h2 text-text-main">{activeSessions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Tag className="h-5 w-5" />
            </span>
            <div>
              <p className="text-caption text-text-desc">Harga per Rak</p>
              <p className="text-h2 text-text-main">
                {pricePerRak
                  ? new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      maximumFractionDigits: 0,
                    }).format(Number(pricePerRak))
                  : '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {message ? (
        <Card className="border-primary-400 bg-primary-50 p-4 text-sm text-text-main mb-6">
          {message}
        </Card>
      ) : null}

      <div className="md:hidden flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('listing')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'listing' ? 'border-primary-500 text-primary-950' : 'border-transparent text-text-desc'
          }`}
        >
          Listing Hari Ini
        </button>
        <button
          onClick={() => setActiveTab('sesi')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'sesi' ? 'border-transparent text-text-desc' : 'border-primary-500 text-primary-950'
          }`}
        >
          Sesi Waktu
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <Card className={`flex flex-col gap-5 p-6 h-fit ${activeTab !== 'listing' ? 'hidden md:flex' : ''}`}>
          <div>
            <h2 className="text-h2 text-text-main mb-1">Listing Hari Ini</h2>
            <p className="text-body text-text-desc">Atur harga dan stok harian.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-3">
              <div>
                <Label>Harga per rak</Label>
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
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Stok rak (tersedia)</Label>
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
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveListing} disabled={isSavingListing} className="w-full mt-2">
            {isSavingListing ? 'Menyimpan...' : 'Simpan Listing'}
          </Button>
        </Card>

        <Card className={`flex flex-col gap-5 p-6 ${activeTab !== 'sesi' ? 'hidden md:flex' : ''}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-h2 text-text-main mb-1">Sesi Ketersediaan</h2>
              <p className="text-body text-text-desc">Pilih sesi jam operasional Anda.</p>
            </div>
            {isSyncingSlots && (
              <span className="text-xs font-semibold text-primary-700 animate-pulse bg-primary-50 px-2 py-1 rounded">
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
                  className={`flex items-center justify-between rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                    isActive ? 'border-primary-200 bg-primary-50' : 'border-border hover:bg-bg-surface'
                  }`}
                  onClick={() => !isSyncingSlots && handleToggleSession(session)}
                >
                  <div>
                    <p className="text-body-medium text-text-main font-semibold">Sesi {session}</p>
                    <p className={`text-caption ${isActive ? 'text-success-text' : 'text-text-desc'}`}>
                      {isActive ? 'Aktif' : 'Nonaktif'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 focus:outline-none"
                    aria-label={`Toggle sesi ${session}`}
                  >
                    {isActive ? (
                      <ToggleRight className="h-8 w-8 text-success" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-text-desc" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
