'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyticsSection } from '@/components/peternak/AnalyticsSection';
import { WalletCard } from '@/components/peternak/WalletCard';
import { ToggleRight, ToggleLeft, TrendingUp, Settings, Store } from 'lucide-react';
import Link from 'next/link';
import { showToast } from '@/components/ui/toast';

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
  peternakName?: string;
}

export function PeternakDashboard({ initialListing, peternakName }: PeternakDashboardProps) {
  const router = useRouter();
  const [isListingActive, setIsListingActive] = useState(initialListing?.is_listing_active ?? false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!initialListing) {
      showToast("Silakan atur harga dan stok di menu Atur Ketersediaan terlebih dahulu.", 'error');
      return;
    }

    const newStatus = !isListingActive;
    // Optimistic UI update
    setIsListingActive(newStatus);
    setIsToggling(true);

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_rak: initialListing.price_per_rak,
          stock_rak: initialListing.stock_rak,
          is_listing_active: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal merubah status toko');
      }

      router.refresh();
    } catch (error) {
      showToast("Terjadi kesalahan saat merubah status toko.", 'error');
      // Revert status on error
      setIsListingActive(!newStatus);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-row items-center justify-between gap-3 overflow-hidden">
        <h1 className="text-h1 font-bold text-text-main truncate min-w-0">
          Halo, {peternakName ?? 'Peternak'}
        </h1>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className="flex items-center gap-2 shrink-0 rounded-full border border-border bg-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-text-main shadow-sm hover:bg-neutral-50 transition-colors focus:outline-none disabled:opacity-70"
        >
          {isListingActive ? (
            <ToggleRight className="h-6 w-6 md:h-7 md:w-7 text-success" />
          ) : (
            <ToggleLeft className="h-6 w-6 md:h-7 md:w-7 text-text-desc" />
          )}
          <span className="hidden md:inline font-semibold">{isListingActive ? 'Buka' : 'Tutup'}</span>
          <span className="md:hidden font-semibold">{isListingActive ? 'Buka' : 'Tutup'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Dompet */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <WalletCard />
        </div>

        {/* Kolom Kanan: Analytics */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          <AnalyticsSection />
        </div>
      </div>
    </div>
  );
}
