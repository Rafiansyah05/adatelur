import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

export function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-14 md:px-6 md:py-20">
        <Reveal className="order-2 md:order-1">
          <h1 className="text-[34px] font-bold leading-[1.12] tracking-tight text-landing-text md:text-[52px]">
            <span className="block">Telur segar tiap hari,</span>
            <span className="block text-landing-500">langsung dari peternaknya.</span>
          </h1>
          <p className="mt-5 max-w-[490px] text-[16px] leading-relaxed text-landing-desc md:text-[18px]">
            adatelur menghubungkan kamu dengan peternak ayam petelur terverifikasi di sekitarmu. Harga
            adil, kualitas terjaga, peternak senang dan konsumen tenang.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              href="/register-consumer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-landing-400 px-6 py-4 text-[15px] font-bold text-landing-950 transition-all hover:-translate-y-0.5 hover:bg-landing-500 active:scale-[.98]"
            >
              Belanja Telur
              <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-landing-border bg-white px-6 py-4 text-[15px] font-bold text-landing-text transition-colors hover:border-landing-400 hover:bg-landing-50"
            >
              Jadi Peternak
            </Link>
          </div>
        </Reveal>

        <Reveal className="order-1 md:order-2" delay={100}>
          <Image
            src="/icons/banner1.jpg"
            alt="Peternak mengambil telur segar di kandang"
            width={720}
            height={620}
            priority
            className="h-auto w-full rounded-lg object-cover shadow-lg"
          />
        </Reveal>
      </div>
    </section>
  );
}
