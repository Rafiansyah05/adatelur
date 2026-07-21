import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'Tersedia' | 'Menunggu' | 'Diterima' | 'Ditolak' | 'Kadaluarsa' | 'Selesai';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(({ className, status, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium leading-none',
        {
          'bg-success-bg text-success-text': status === 'Tersedia' || status === 'Diterima',
          'bg-primary-100 text-primary-700': status === 'Menunggu',
          'bg-[#FBE9E7] text-[#E23D28]': status === 'Ditolak' || status === 'Kadaluarsa',
          'bg-cream text-text-main': status === 'Selesai',
        },
        className
      )}
      {...props}
    >
      {status}
    </div>
  );
});
Badge.displayName = 'Badge';

export { Badge };
