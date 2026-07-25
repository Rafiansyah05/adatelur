import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

export function RatingModal({ isOpen, onClose, orderId, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Silakan pilih rating terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan rating');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-neutral-100">
          <h3 className="font-bold text-lg text-neutral-800">Beri Rating Pesanan</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-md transition-colors">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center gap-4">
          <p className="text-center text-sm text-neutral-600 mb-2">
            Bagaimana kualitas pelayanan dan produk dari peternak ini?
          </p>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 focus:outline-none"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                disabled={isSubmitting}
              >
                <Star 
                  className={cn(
                    "h-10 w-10 transition-colors cursor-pointer",
                    (hoveredRating ? star <= hoveredRating : star <= rating)
                      ? "fill-primary-400 text-primary-400"
                      : "fill-neutral-100 text-neutral-200"
                  )} 
                />
              </button>
            ))}
          </div>
          
          {error && <p className="text-danger-text text-sm font-semibold">{error}</p>}
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? 'Menyimpan...' : 'Kirim Rating'}
          </Button>
        </div>
      </div>
    </div>
  );
}
