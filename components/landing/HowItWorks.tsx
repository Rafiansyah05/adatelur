'use client';

import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Box } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

type TabKey = 'buyer' | 'seller';

const illustrations: { tab: TabKey; index: number }[] = [
  { tab: 'buyer', index: 0 },
  { tab: 'buyer', index: 1 },
  { tab: 'buyer', index: 2 },
  { tab: 'seller', index: 0 },
  { tab: 'seller', index: 1 },
  { tab: 'seller', index: 2 },
];

const content: Record<TabKey, { label: string; icon: typeof ShoppingCart; steps: { title: string; description: string }[] }> = {
  buyer: {
    label: 'Sebagai Pembeli',
    icon: ShoppingCart,
    steps: [
      { title: 'Cari peternak terdekat', description: 'Lihat daftar peternak terverifikasi di sekitarmu, lengkap dengan harga, stok, dan rating.' },
      { title: 'Pesan dan pilih pengiriman', description: 'Tentukan jumlah rak, lalu pilih diantar ke rumah atau ambil sendiri sesuai slot waktu.' },
      { title: 'Terima telur segar', description: 'Peternak konfirmasi pesanan, telur dikirim segar. Beri rating setelah selesai.' },
    ],
  },
  seller: {
    label: 'Sebagai Peternak',
    icon: Box,
    steps: [
      { title: 'Daftar dan verifikasi', description: 'Isi data peternakanmu. Tim kami verifikasi agar pembeli percaya sejak awal.' },
      { title: 'Atur harga dan stok', description: 'Tentukan harga per rak, stok harian, dan slot pengiriman langsung dari dashboard.' },
      { title: 'Terima order dan cairkan', description: 'Notifikasi masuk lewat web dan WhatsApp. Hasil penjualan langsung masuk dompetmu.' },
    ],
  },
};

export function HowItWorks() {
  const [tab, setTab] = useState<TabKey>('buyer');
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAuto = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    timerRef.current = setInterval(() => setStep((current) => (current + 1) % 3), 4500);
    return stopAuto;
  }, [tab]);

  const selectTab = (key: TabKey) => {
    stopAuto();
    setTab(key);
    setStep(0);
  };

  const selectStep = (index: number) => {
    stopAuto();
    setStep(index);
  };

  const active = content[tab];

  return (
    <section id="cara-kerja" className="scroll-mt-24 bg-landing-cream py-16 md:py-20">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1fr_440px] md:grid-rows-[auto_1fr] md:gap-x-12">
          <Reveal>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-landing-600">Cara Kerja</p>
            <h2 className="mt-3 text-[25px] font-bold leading-tight tracking-tight text-landing-text md:text-[32px]">
              Mudah, dari sisi mana pun kamu
            </h2>
            <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-landing-desc md:text-[16px]">
              Mau beli telur atau mulai jualan sebagai peternak, semuanya cuma tiga langkah.
            </p>

            <div className="mt-7 flex gap-5 border-b border-landing-border sm:gap-8" role="tablist">
              {(['buyer', 'seller'] as TabKey[]).map((key) => {
                const TabIcon = content[key].icon;
                const selected = tab === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => selectTab(key)}
                    className={`relative -mb-px flex items-center gap-2 pb-3.5 text-[14px] font-bold transition-colors sm:text-[15px] ${
                      selected ? 'text-landing-text' : 'text-landing-desc hover:text-landing-text'
                    }`}
                  >
                    <TabIcon className="h-[18px] w-[18px]" />
                    {content[key].label}
                    <span
                      className={`absolute inset-x-0 -bottom-px h-[3px] origin-left rounded-t bg-landing-400 transition-transform ${
                        selected ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal
            className="mx-auto w-full max-w-[320px] sm:max-w-[380px] md:row-span-2 md:max-w-[440px] md:self-center"
            delay={120}
          >
            <div className="relative aspect-[100/84] w-full">
              {illustrations.map((item) => {
                const shown = item.tab === tab && item.index === step;
                return (
                  <img
                    key={`${item.tab}-${item.index}`}
                    src={`/landing/cara-${item.tab}-${item.index}.svg`}
                    alt=""
                    className={`absolute inset-0 h-full w-full transition-all duration-[400ms] ease-out ${
                      shown ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-[.97] opacity-0'
                    }`}
                  />
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="flex max-w-[560px] flex-col">
              {active.steps.map((item, index) => {
                const isActive = index === step;
                const isDone = index <= step;
                const isLast = index === active.steps.length - 1;
                return (
                  <button
                    key={item.title}
                    onClick={() => selectStep(index)}
                    className={`flex w-full items-stretch gap-4 rounded-lg px-3 py-4 text-left transition-all active:scale-[.99] sm:gap-5 sm:px-4 ${
                      isActive ? 'bg-white shadow-md' : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-[16px] font-extrabold transition-colors ${
                          isDone ? 'border-landing-400 bg-landing-400 text-landing-950' : 'border-landing-border bg-white text-landing-desc'
                        }`}
                      >
                        {index + 1}
                      </span>
                      {!isLast && <span className={`my-2 w-0.5 flex-1 ${isDone ? 'bg-landing-400' : 'bg-landing-border'}`} />}
                    </div>
                    <div className="pt-2.5">
                      <h3 className={`text-[17px] font-bold sm:text-[18px] ${isActive ? 'text-landing-text' : 'text-landing-desc'}`}>
                        {item.title}
                      </h3>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isActive ? 'mt-2 max-h-40 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="text-[14px] leading-relaxed text-landing-desc">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
