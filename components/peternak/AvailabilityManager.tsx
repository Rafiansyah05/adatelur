'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ToggleLeft, ToggleRight } from 'lucide-react';

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

interface AvailabilityManagerProps {
  initialListing: ListingRecord | null;
  initialSlots: DeliverySlotRecord[];
}

export function AvailabilityManager({ initialListing, initialSlots }: AvailabilityManagerProps) {
  const [listing, setListing] = React.useState<ListingRecord | null>(initialListing);

  const initialActiveSessions = initialSlots
    .filter((slot) => slot.is_active)
    .map((slot) => {
      const start = slot.start_time.substring(0, 5);
      const end = slot.end_time.substring(0, 5);
      return `${start} - ${end}`;
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
      {message ? (
        <Card className="border-primary-400 bg-primary-50 p-4 text-sm text-text-main mb-6">
          {message}
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6 p-6">
          <div>
            <h2 className="text-h2 text-text-main mb-1">Listing Hari Ini</h2>
            <p className="text-body text-text-desc">Atur harga dan stok harian.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border px-4 py-3 bg-bg-surface">
              <div>
                <p className="text-body-medium text-text-main">Status Jual</p>
                <p className="text-caption text-text-desc">Tampilkan di pencarian publik</p>
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

        <Card className="space-y-6 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-h2 text-text-main mb-1">Sesi Ketersediaan</h2>
              <p className="text-body text-text-desc">Pilih sesi jam operasional Anda.</p>
            </div>
            {isSyncingSlots && (
              <span className="text-xs font-semibold text-primary-600 animate-pulse bg-primary-50 px-2 py-1 rounded">
                Menyimpan...
              </span>
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
