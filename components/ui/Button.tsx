import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-5 py-3 text-[14px] font-semibold leading-none transition-colors disabled:pointer-events-none',
          {
            'bg-primary-400 text-primary-950 hover:bg-primary-500 active:bg-primary-600 disabled:bg-primary-100 disabled:text-text-desc':
              variant === 'primary',
            'bg-white text-text-main border border-border hover:border-primary-400':
              variant === 'secondary',
            'bg-success text-primary-950 hover:bg-[#00E65F]': variant === 'success',
            'bg-transparent text-text-main border border-border hover:bg-neutral-50': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
