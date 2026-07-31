import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

export function AppSection() {
  return (
    <section id="app" className="scroll-mt-24 bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-5 md:grid-cols-[1fr_430px] md:gap-12 md:px-6">
        <Reveal>
          <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-landing-600">Aplikasi</p>
          <h2 className="mt-4 text-[27px] font-bold leading-tight tracking-tight text-landing-text md:text-[36px]">
            Pasang adatelur di layar utama HP kamu
          </h2>
          <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-landing-desc md:text-[17px]">
            Nggak perlu lewat app store. Tambahkan adatelur ke layar utama, ringan dan langsung siap dipakai
            kapan saja seperti aplikasi biasa.
          </p>
          <Link
            href="/register-consumer"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-landing-400 px-6 py-4 text-[15px] font-bold text-landing-950 transition-all hover:-translate-y-0.5 hover:bg-landing-500 active:scale-[.98]"
          >
            Pasang Aplikasi
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        </Reveal>

        <Reveal className="flex justify-center" delay={120}>
          <img src="/landing/app-home.svg" alt="Aplikasi adatelur di layar utama HP" className="w-full max-w-[430px]" />
        </Reveal>
      </div>
    </section>
  );
}
