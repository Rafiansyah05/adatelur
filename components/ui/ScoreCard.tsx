import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { Star, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface ScoreCardProps {
  peternakName: string;
  avatarInitials: string;
  rating: number;
  score: number;
  pricePerRak: number;
  estimatedOngkir: number;
  isTopPick?: boolean;
  onPesanClick?: () => void;
  className?: string;
}

const ScoreCard = React.forwardRef<HTMLDivElement, ScoreCardProps>(
  (
    {
      peternakName,
      avatarInitials,
      rating,
      score,
      pricePerRak,
      estimatedOngkir,
      isTopPick = false,
      onPesanClick,
      className,
    },
    ref
  ) => {
    const total = pricePerRak + estimatedOngkir;

    return (
      <Card
        ref={ref}
        className={cn(
          'flex flex-col gap-4',
          isTopPick && 'border-2 border-primary-400',
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[14px] font-bold text-primary-950">
              {avatarInitials}
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-text-main">{peternakName}</h3>
              <div className="mt-1 flex items-center gap-2 text-[14px] text-text-main">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary-400 text-primary-400" />
                  {rating.toFixed(1)}
                </span>
                <span className="text-border">|</span>
                <span className="inline-flex items-center rounded-sm bg-primary-400 px-2 py-0.5 text-[12px] font-bold text-primary-950">
                  Score {score}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-[14px] text-text-main">
          <p>Rp {pricePerRak.toLocaleString('id-ID')}/rak</p>
          <p>Estimasi ongkir: Rp {estimatedOngkir.toLocaleString('id-ID')}</p>
        </div>

        <div className="my-1 h-[1px] w-full bg-border" />

        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-text-main">
            Total: Rp {total.toLocaleString('id-ID')}
          </p>
          <Button variant="primary" onClick={onPesanClick} className="py-2 px-4">
            Pesan <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }
);
ScoreCard.displayName = 'ScoreCard';

export { ScoreCard };
