'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';
import { Bot, CheckCircle2, ChevronRight, Clock3, ToggleLeft, ToggleRight } from 'lucide-react';

const SESSION_BLOCKS = [
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

interface PeternakDashboardProps {
  initialListing: ListingRecord | null;
  initialSlots: DeliverySlotRecord[];
}

export function PeternakDashboard({ initialListing, initialSlots }: PeternakDashboardProps) {
  const [listing, setListing] = React.useState<ListingRecord | null>(initialListing);
  
  // Format the existing slots into strings matching SESSION_BLOCKS
  const initialActiveSessions = initialSlots
    .filter(slot => slot.is_active)
    .map(slot => {
      const s = slot.start_time.substring(0, 5);
      const e = slot.end_time.substring(0, 5);
      return `${s} - ${e}`;
    });

  const [activeSessions, setActiveSessions] = React.useState<string[]>(initialActiveSessions);

  const [pricePerRak, setPricePerRak] = React.useState(
    initialListing?.price_per_rak?.toString() ?? ''
  );
  const [stockRak, setStockRak] = React.useState(initialListing?.stock_rak?.toString() ?? '');
  const [isListingActive, setIsListingActive] = React.useState(
    initialListing?.is_listing_active ?? true
  );

  const [isSavingListing, setIsSavingListing] = React.useState(false);
  const [isSyncingSlots, setIsSyncingSlots] = React.useState(false);
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    setListing(initialListing);
    setPricePerRak(initialListing?.price_per_rak?.toString() ?? '');
    setStockRak(initialListing?.stock_rak?.toString() ?? '');
    setIsListingActive(initialListing?.is_listing_active ?? true);
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
          is_listing_active: isListingActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan listing');
      }

      setListing(data.listing);
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
      newSessions = newSessions.filter(s => s !== sessionStr);
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
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-body text-text-desc mb-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-display text-text-main">Dashboard Peternak</h1>
          <p className="text-body text-text-desc mt-1">
            Kelola penjualan telur Anda hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-text-main shadow-sm">
          {listing?.is_listing_active ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Clock3 className="h-4 w-4 text-text-desc" />
          )}
          {listing?.is_listing_active ? 'Toko Buka (Publik)' : 'Toko Tutup (Sembunyi)'}
        </div>
      </div>

      {message ? (
        <Card className="border-primary-400 bg-primary-50 p-4 text-sm text-text-main mb-6">
          {message}
        </Card>
      ) : null}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
        <Card className="p-5 flex flex-col justify-center">
          <p className="text-caption text-text-desc mb-1">Status Listing</p>
          <p className="text-h1 text-text-main">{listing?.is_listing_active ? 'Aktif' : 'Nonaktif'}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-center">
          <p className="text-caption text-text-desc mb-1">Stok Rak</p>
          <p className="text-h1 text-text-main">{stockRak || '0'}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-center">
          <p className="text-caption text-text-desc mb-1">Slot Aktif</p>
          <p className="text-h1 text-text-main">{activeSessions.length}</p>
        </Card>
        <Card className="p-5 flex flex-col justify-center">
          <p className="text-caption text-text-desc mb-1">Harga per Rak</p>
          <p className="text-h2 text-text-main">
            {pricePerRak ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(pricePerRak)) : '-'}
          </p>
        </Card>
      </div>

      <Link
        href="/dashboard/assistant"
        className="mb-8 flex items-center gap-4 rounded-lg border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary-400"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100">
          <Bot className="h-5 w-5 text-primary-700" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-h3 text-text-main">Asisten AI</p>
          <p className="text-caption text-text-desc">Tanya seputar operasional ternak Anda</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-text-desc" />
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LISTING HARI INI */}
        <Card className="space-y-6 p-6">
          <div>
            <h2 className="text-h2 text-text-main mb-1">Listing Hari Ini</h2>
            <p className="text-body text-text-desc">
              Atur harga dan stok harian.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 bg-bg-surface">
              <div>
                <p className="text-body-medium text-text-main">Status Jual</p>
                <p className="text-caption text-text-desc">
                  Tampilkan di pencarian publik
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-1 focus:outline-none"
                onClick={() => setIsListingActive((value) => !value)}
                aria-label="Toggle status listing"
              >
                {isListingActive ? (
                  <ToggleRight className="h-8 w-8 text-success" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-text-desc" />
                )}
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label>Harga per rak</Label>
                <Input
                  type="number"
                  min="0"
                  value={pricePerRak}
                  onChange={(event) => setPricePerRak(event.target.value)}
                  placeholder="Contoh: 35000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Stok rak (tersedia)</Label>
                <Input
                  type="number"
                  min="0"
                  value={stockRak}
                  onChange={(event) => setStockRak(event.target.value)}
                  placeholder="Contoh: 20"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveListing} disabled={isSavingListing} className="w-full">
            {isSavingListing ? 'Menyimpan...' : 'Simpan Listing'}
          </Button>
        </Card>

        {/* SLOT PENGIRIMAN */}
        <Card className="space-y-6 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-h2 text-text-main mb-1">Sesi Ketersediaan</h2>
              <p className="text-body text-text-desc">
                Pilih sesi jam operasional Anda.
              </p>
            </div>
            {isSyncingSlots && (
              <span className="text-xs font-semibold text-primary-600 animate-pulse bg-primary-50 px-2 py-1 rounded">Menyimpan...</span>
            )}
          </div>

          <div className="space-y-2">
            {SESSION_BLOCKS.map((session) => {
              const isActive = activeSessions.includes(session);
              return (
                <div
                  key={session}
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => !isSyncingSlots && handleToggleSession(session)}
                >
                  <div>
                    <p className="text-body-medium text-text-main font-semibold">
                      Sesi {session}
                    </p>
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
