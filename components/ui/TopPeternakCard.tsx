import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { Star, MapPin } from 'lucide-react';
import Image from 'next/image';

export interface TopPeternakCardProps {
  peternakName: string;
  avatarInitials: string;
  avatarUrl?: string;
  location?: string;
  rating?: number;
  averageRating?: number;
  score: number;
  rank: number;
  className?: string;
}

const TopPeternakCard = React.forwardRef<HTMLDivElement, TopPeternakCardProps>(
  (
    {
      peternakName,
      avatarInitials,
      avatarUrl,
      location,
      rating = 0,
      averageRating,
      score,
      rank,
      className,
    },
    ref
  ) => {
    const getAvatarBorderColor = (rank: number) => {
      switch (rank) {
        case 1:
          return 'border-yellow-400';
        case 2:
          return 'border-gray-300';
        case 3:
          return 'border-amber-700';
        default:
          return 'border-neutral-200';
      }
    };

    const getRankBadgeColor = (rank: number) => {
      switch (rank) {
        case 1:
          return 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-950 shadow-sm';
        case 2:
          return 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-900 shadow-sm';
        case 3:
          return 'bg-gradient-to-br from-amber-600 to-orange-800 text-amber-50 shadow-sm';
        default:
          return 'bg-neutral-100 text-neutral-600';
      }
    };

    const displayRating = averageRating ?? rating;
    const ratingText = displayRating === 0 ? 'Baru' : displayRating.toFixed(1);

    return (
      <Card
        ref={ref}
        className={cn(
          'relative flex flex-col items-center overflow-hidden rounded-2xl bg-white p-6 border border-neutral-100',
          className
        )}
      >
        <div className="pointer-events-none absolute -bottom-8 -right-8 z-0 opacity-[0.03]">
          <Image
            src="/icons/icon-512x512.png"
            alt="watermark"
            width={160}
            height={160}
            className="grayscale"
          />
        </div>

        <div className={cn("absolute top-4 left-4 z-10 flex h-8 w-8 items-center justify-center rounded-full font-black text-sm border-2 border-white", getRankBadgeColor(rank))}>
          {rank}
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 border border-amber-100 text-xs font-bold text-amber-900 shadow-sm">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{ratingText}</span>
        </div>
        <div className={cn("relative z-10 mt-2 mb-4 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-50 text-2xl font-bold text-primary-900 overflow-hidden border-4", getAvatarBorderColor(rank))}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={peternakName} className="h-full w-full object-cover" />
          ) : (
            avatarInitials
          )}
        </div>


        <div className="relative z-10 flex flex-col items-center w-full text-center mb-1">
          <h3 className="text-lg font-black text-neutral-900 line-clamp-1 w-full px-2">{peternakName}</h3>
          <div className="flex items-center justify-center gap-1 text-sm text-neutral-500 mt-1 max-w-[90%]">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
            <span className="line-clamp-1 leading-tight">{location || 'Alamat tidak tersedia'}</span>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 border border-primary-100 w-full justify-center">
          <span className="text-xs font-medium text-primary-800">Score Sistem:</span>
          <span className="text-lg font-black text-primary-700">
            {score > 0 ? score : 'Baru!'}
          </span>
        </div>
      </Card>
    );
  }
);
TopPeternakCard.displayName = 'TopPeternakCard';

export { TopPeternakCard };
