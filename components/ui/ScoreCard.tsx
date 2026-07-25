import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { Star, ChevronRight, MapPin, Award, Sparkles } from 'lucide-react';
import { Button } from './Button';
import Image from 'next/image';

export interface ScoreCardProps {
  peternakName: string;
  avatarInitials: string;
  location?: string;
  rating?: number;
  averageRating?: number;
  totalOrders?: number;
  score: number;
  pricePerRak: number;
  rakQuantity?: number;
  estimatedOngkir: number;
  distanceKm?: number;
  isTopPick?: boolean;
  rank?: number;
  onPesanClick?: () => void;
  className?: string;
}

const ScoreCard = React.forwardRef<HTMLDivElement, ScoreCardProps>(
  (
    {
      peternakName,
      avatarInitials,
      location,
      rating = 0,
      averageRating,
      totalOrders,
      score,
      pricePerRak,
      rakQuantity = 1,
      estimatedOngkir,
      distanceKm = 0,
      isTopPick = false,
      rank,
      onPesanClick,
      className,
    },
    ref
  ) => {
    const total = (pricePerRak * rakQuantity) + estimatedOngkir;

    const getMedalColor = (rank: number) => {
      switch (rank) {
        case 1:
          return 'from-yellow-300 to-yellow-500 text-yellow-900 border-yellow-200'; // Gold
        case 2:
          return 'from-gray-200 to-gray-400 text-gray-800 border-gray-100'; // Silver
        case 3:
          return 'from-amber-600 to-orange-800 text-orange-100 border-amber-500'; // Bronze
        default:
          return '';
      }
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'relative flex flex-col gap-4 overflow-hidden rounded-lg border border-neutral-100 bg-white p-5 transition-all hover:bg-neutral-50 hover:border-neutral-200',
          className
        )}
      >
        {/* Background Watermark */}
        <div className="pointer-events-none absolute -bottom-6 -right-6 z-0 opacity-10">
          <Image
            src="/icons/icon-512x512.png"
            alt="watermark"
            width={140}
            height={140}
            className="grayscale"
          />
        </div>

        {/* Top Badges Area */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            {isTopPick && (
              <div className="inline-flex w-fit items-center gap-1.5 rounded-md bg-primary-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-primary-800">
                <Sparkles className="h-3.5 w-3.5" /> Paling Efisien
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-900 shadow-sm border border-primary-100">
                {avatarInitials}
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-neutral-800">{peternakName}</h3>
                {location && (
                  <div className="flex items-start gap-1 text-xs text-neutral-500 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-neutral-400" />
                    <span className="line-clamp-1">{location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medal Badge */}
          {rank && rank <= 3 && (
            <div
              className={cn(
                'flex shrink-0 items-center justify-center gap-1 rounded-md bg-gradient-to-br px-2.5 py-1 shadow-sm border',
                getMedalColor(rank)
              )}
            >
              <Award className="h-4 w-4" />
              <span className="text-xs font-black">#{rank}</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="relative z-10 mt-2 flex items-center justify-between rounded-lg bg-neutral-50 p-3 border border-neutral-100">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 font-medium">Rating</span>
            <div className="flex items-center gap-1 font-bold text-neutral-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>
                {totalOrders === 0 ? 'Baru' : (averageRating ?? rating).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-200" />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 font-medium">Score Sistem</span>
            <div className="flex items-center gap-1 font-black text-primary-600">
              <span>{score > 0 ? score : 'Baru!'}</span>
              {score > 0 && <span className="text-[10px] text-neutral-400 font-normal">pts</span>}
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-200" />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 font-medium">Jarak</span>
            <div className="flex items-center gap-1 font-bold text-neutral-700">
              <span>{distanceKm > 0 ? distanceKm.toFixed(1) : '-'}</span>
              <span className="text-[10px] text-neutral-400 font-normal">km</span>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="relative z-10 flex flex-col gap-1.5 text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>Harga per rak</span>
            <span className="font-semibold text-neutral-800">Rp {pricePerRak.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimasi ongkir</span>
            <span className="font-semibold text-neutral-800">Rp {estimatedOngkir.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="relative z-10 my-1 h-px w-full bg-neutral-100" />

        {/* Total & Action */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-neutral-500">Total Biaya</span>
            <span className="text-lg font-black text-neutral-900">
              Rp {total.toLocaleString('id-ID')}
            </span>
          </div>
          <Button 
            variant="primary" 
            onClick={onPesanClick} 
            className="rounded-lg px-6 py-2.5 transition-all font-semibold text-sm"
          >
            Pesan <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }
);
ScoreCard.displayName = 'ScoreCard';

export { ScoreCard };
