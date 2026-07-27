'use client';

import { AnalyticsSection } from '@/components/peternak/AnalyticsSection';
import { WalletCard } from '@/components/peternak/WalletCard';
import { CheckCircle2, Clock3 } from 'lucide-react';

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

export function PeternakDashboard({ initialListing }: PeternakDashboardProps) {
  const isListingActive = initialListing?.is_listing_active ?? false;

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-h1 text-text-main">Dashboard Peternak</h1>
        <div className="flex items-center gap-2 self-start rounded-full border border-border bg-white px-4 py-2 text-sm text-text-main shadow-sm md:self-auto">
          {isListingActive ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Clock3 className="h-4 w-4 text-text-desc" />
          )}
          {isListingActive ? 'Toko Buka (Publik)' : 'Toko Tutup (Sembunyi)'}
        </div>
      </div>

      <WalletCard />

      <AnalyticsSection />
    </div>
  );
}
