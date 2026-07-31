import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

export function FinalCta() {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <Reveal className="rounded-lg bg-landing-400 px-6 py-14 text-center md:px-12 md:py-16">
          <h2 className="mx-auto max-w-[560px] text-[27px] font-bold leading-tight tracking-tight text-landing-950 md:text-[38px]">
            Siap mulai dengan adatelur?
          </h2>
          <p className="mx-auto mt-3.5 max-w-[520px] text-[16px] leading-relaxed text-landing-900 md:text-[17px]">
            Gabung sekarang. Beli telur segar atau mulai jual hasil ternakmu langsung ke pembeli.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/register-consumer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-landing-950 px-6 py-4 text-[15px] font-bold text-landing-100 transition-all hover:-translate-y-0.5 hover:bg-black active:scale-[.98]"
            >
              Belanja Telur
              <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-landing-700 bg-transparent px-6 py-4 text-[15px] font-bold text-landing-950 transition-all hover:-translate-y-0.5 hover:bg-landing-500 active:scale-[.98]"
            >
              Jadi Peternak
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
