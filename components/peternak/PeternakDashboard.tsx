'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnalyticsSection } from '@/components/peternak/AnalyticsSection';
import { Bot, CheckCircle2, ChevronRight, Clock3 } from 'lucide-react';

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
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-body text-text-desc mb-1">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h1 className="text-display text-text-main">Dashboard Peternak</h1>
          <p className="text-body text-text-desc mt-1">Ringkasan penjualan telur Anda hari ini.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm text-text-main shadow-sm">
          {isListingActive ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Clock3 className="h-4 w-4 text-text-desc" />
          )}
          {isListingActive ? 'Toko Buka (Publik)' : 'Toko Tutup (Sembunyi)'}
        </div>
      </div>

      <Link
        href="/dashboard/assistant"
        className="flex items-center gap-4 rounded-lg border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary-400"
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

      <div className="mt-8">
        <AnalyticsSection />
      </div>
    </div>
  );
}
