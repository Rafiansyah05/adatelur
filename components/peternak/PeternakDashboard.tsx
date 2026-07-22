'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CheckCircle2, Clock3, ToggleLeft, ToggleRight } from 'lucide-react';

interface ListingRecord {
  id?: string;
  price_per_rak: number;
  stock_rak: number;
  is_listing_active: boolean;
  listing_date: string;
}

interface DeliverySlotRecord {
  id: string;
  slot_date: string;
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
  const [slots, setSlots] = React.useState<DeliverySlotRecord[]>(initialSlots);
  const [pricePerRak, setPricePerRak] = React.useState(
    initialListing?.price_per_rak?.toString() ?? ''
  );
  const [stockRak, setStockRak] = React.useState(initialListing?.stock_rak?.toString() ?? '');
  const [isListingActive, setIsListingActive] = React.useState(
    initialListing?.is_listing_active ?? true
  );
  const [slotDate, setSlotDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [isSavingListing, setIsSavingListing] = React.useState(false);
  const [isSavingSlot, setIsSavingSlot] = React.useState(false);
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

  const handleCreateSlot = async () => {
    if (!slotDate || !startTime || !endTime) {
      setMessage('Lengkapi tanggal dan jam slot terlebih dahulu.');
      return;
    }

    setIsSavingSlot(true);
    setMessage('');

    try {
      const response = await fetch('/api/delivery-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_date: slotDate,
          start_time: startTime,
          end_time: endTime,
          is_active: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menambahkan slot');
      }

      setSlots((current) => [...current, data.slot]);
      setSlotDate('');
      setStartTime('');
      setEndTime('');
      setMessage('Slot waktu berhasil ditambahkan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsSavingSlot(false);
    }
  };

  const handleToggleSlot = async (slotId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/delivery-slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengubah status slot');
      }

      setSlots((current) => current.map((slot) => (slot.id === slotId ? data.slot : slot)));
      setMessage('Status slot berhasil diperbarui.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4 pb-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-caption font-semibold uppercase tracking-[0.2em] text-primary-600">
            Dashboard Peternak
          </p>
          <h1 className="text-h1 text-text-main">Kelola listing & slot waktu</h1>
          <p className="text-body text-text-desc">
            Stok Anda hanya terlihat di dashboard peternak ini dan tidak dipublikasikan ke publik.
          </p>
        </div>

        {message ? (
          <Card className="border-primary-400 bg-primary-50 p-4 text-sm text-text-main">
            {message}
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h2 text-text-main">Posting listing harian</h2>
                <p className="text-body text-text-desc">
                  Atur harga, status aktif jual, dan stok rak Anda hari ini.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-cream px-3 py-2 text-sm text-text-main">
                {listing?.is_listing_active ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Clock3 className="h-4 w-4 text-text-desc" />
                )}
                {listing?.is_listing_active ? 'Tampil di publik' : 'Disembunyikan'}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Harga per rak</Label>
                <Input
                  type="number"
                  min="0"
                  value={pricePerRak}
                  onChange={(event) => setPricePerRak(event.target.value)}
                  placeholder="Contoh: 35000"
                />
              </div>
              <div>
                <Label>Stok rak (private)</Label>
                <Input
                  type="number"
                  min="0"
                  value={stockRak}
                  onChange={(event) => setStockRak(event.target.value)}
                  placeholder="Contoh: 20"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                <div>
                  <p className="text-body-medium text-text-main">Aktif jual hari ini</p>
                  <p className="text-caption text-text-desc">
                    Switch ini mengontrol apakah listing terlihat untuk konsumen.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1"
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
            </div>

            <Button onClick={handleSaveListing} disabled={isSavingListing} className="w-full">
              {isSavingListing ? 'Menyimpan...' : 'Simpan listing hari ini'}
            </Button>
          </Card>

          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-h2 text-text-main">Kelola delivery slots</h2>
              <p className="text-body text-text-desc">
                Tambahkan slot pengiriman atau pengambilan yang tersedia untuk konsumen.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Tanggal slot</Label>
                <Input
                  type="date"
                  value={slotDate}
                  onChange={(event) => setSlotDate(event.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Jam mulai</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Jam selesai</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateSlot}
              disabled={isSavingSlot}
              className="w-full"
              variant="secondary"
            >
              {isSavingSlot ? 'Menambahkan...' : 'Tambah slot baru'}
            </Button>

            <div className="space-y-3">
              {slots.length === 0 ? (
                <p className="text-body text-text-desc">Belum ada slot yang ditambahkan.</p>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-body-medium text-text-main">
                        {slot.slot_date} • {slot.start_time} - {slot.end_time}
                      </p>
                      <p className="text-caption text-text-desc">
                        {slot.is_active ? 'Aktif' : 'Nonaktif'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-border px-3 py-1 text-sm text-text-main"
                      onClick={() => handleToggleSlot(slot.id, slot.is_active)}
                    >
                      {slot.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
