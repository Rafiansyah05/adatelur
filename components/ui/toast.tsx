'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastEvent {
  message: string;
  type: ToastType;
}

export const showToast = (message: string, type: ToastType = 'info') => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<ToastEvent>('show-toast', { detail: { message, type } });
    window.dispatchEvent(event);
  }
};

export const GlobalToast = () => {
  const [toasts, setToasts] = useState<(ToastEvent & { id: number })[]>([]);

  useEffect(() => {
    const handleShowToast = (e: CustomEvent<ToastEvent>) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { ...e.detail, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleShowToast as EventListener);
    return () => window.removeEventListener('show-toast', handleShowToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none w-[90%] max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl pointer-events-auto transform transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
        >
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}

          <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>

          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="p-1.5 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
          >
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>
      ))}
    </div>
  );
};
