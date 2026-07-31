import Link from 'next/link';
import Image from 'next/image';
import { Megaphone, Package, Wallet, Star, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

const features = [
  { icon: Megaphone, title: 'Jangkau pembeli langsung', description: 'Muncul di pencarian konsumen sekitarmu tanpa perantara.' },
  { icon: Package, title: 'Kelola order & stok', description: 'Atur harga, stok harian, dan slot pengiriman dengan mudah.' },
  { icon: Wallet, title: 'Dompet & pencairan', description: 'Pemasukan masuk otomatis, cairkan kapan pun kamu mau.' },
  { icon: Star, title: 'Skor reputasi', description: 'Layanan bagus menaikkan skor dan bikin tokomu lebih laris.' },
];

export function ForPeternak() {
  return (
    <section id="peternak" className="scroll-mt-24 bg-landing-950 py-16 md:py-24">
      <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-5 md:grid-cols-2 md:gap-14 md:px-6">
        <Reveal className="order-1">
          <Image
            src="/icons/banner2.jpg"
            alt="Peternak dan rak telur"
            width={640}
            height={560}
            className="h-auto w-full rounded-lg object-cover shadow-lg"
          />
        </Reveal>

        <div className="order-2">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-landing-300">Untuk Peternak</p>
          <h2 className="mt-4 text-[27px] font-bold leading-tight tracking-tight text-white md:text-[36px]">
            Jual telurmu langsung ke pembeli
          </h2>
          <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-landing-200 md:text-[17px]">
            Tanpa tengkulak, tanpa harga ditekan. Kelola pesanan, stok, dan pemasukan dari satu dashboard
            yang gampang dipakai.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-landing-800 text-landing-300">
                  <feature.icon className="h-[22px] w-[22px]" />
                </span>
                <div>
                  <h3 className="text-[16px] font-extrabold text-white">{feature.title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-landing-200">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/register"
            className="mt-9 inline-flex items-center justify-center gap-2 rounded-md bg-landing-400 px-6 py-4 text-[15px] font-bold text-landing-950 transition-all hover:-translate-y-0.5 hover:bg-landing-300 active:scale-[.98]"
          >
            Gabung Jadi Peternak
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
