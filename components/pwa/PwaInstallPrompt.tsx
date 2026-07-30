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
  const [isIOS, setIsIOS] = React.useState(false);
  const [showIosInstructions, setShowIosInstructions] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { });
    }

    const checkStandalone = () => {
      return (window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as any).standalone === true;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e: Event) => {
      if (deferredPrompt) return;
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (isIosDevice && !checkStandalone()) {
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('beforeinstallprompt', handler);
        };
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto p-5 pb-5 bg-white rounded-2xl border border-border shadow-xl md:mx-0 md:w-[350px] md:bottom-6 md:left-6">
      <div className="flex flex-col gap-4">
        {showIosInstructions ? (
          <div className="text-sm text-neutral-700">
            <p className="font-semibold mb-2 text-text-main">Cara Pasang di iPhone:</p>
            <ol className="list-decimal pl-4 space-y-1.5 mb-4 text-xs leading-relaxed">
              <li>Ketuk ikon <strong>Bagikan (Share)</strong> <svg className="inline w-3 h-3 text-blue-500 mx-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> di bawah layar Safari.</li>
              <li>Pilih <svg className="inline w-3 h-3 mx-0.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> <strong>Tambah ke Layar Utama</strong> (Add to Home Screen).</li>
            </ol>
            <Button variant="primary" onClick={dismissPrompt} className="w-full h-11">
              Mengerti
            </Button>
          </div>
        ) : (
          <>
            <div>
              <h4 className="text-body-medium text-text-main font-bold">Pasang adatelur</h4>
              <p className="text-caption text-text-desc mt-1.5 leading-relaxed">
                Akses lebih cepat langsung dari layar utama HP Anda.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button variant="secondary" onClick={dismissPrompt} className="flex-1 h-11">
                Nanti
              </Button>
              <Button variant="primary" onClick={handleInstallClick} className="flex-1 h-11">
                {isIOS ? 'Cara Pasang' : 'Pasang'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
