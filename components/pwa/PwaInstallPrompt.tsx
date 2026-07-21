'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    setShowPrompt(false);
    deferredPrompt.prompt();
    
    await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe bg-white border-t border-border shadow-lg md:bottom-4 md:left-4 md:right-auto md:w-80 md:rounded-md md:border">
      <div className="flex flex-col gap-3">
        <div>
          <h4 className="text-body-medium text-text-main font-semibold">Pasang adatelur.com</h4>
          <p className="text-caption text-text-desc mt-1">Akses lebih cepat langsung dari layar utama HP Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowPrompt(false)} className="flex-1 py-2">
            Nanti
          </Button>
          <Button variant="primary" onClick={handleInstallClick} className="flex-1 py-2">
            Pasang
          </Button>
        </div>
      </div>
    </div>
  );
}
