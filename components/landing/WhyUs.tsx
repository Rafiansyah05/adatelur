import { ShieldCheck, Star, Lock, Smartphone } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

export function WhyUs() {
  return (
    <section className="bg-landing-cream py-16 md:py-24">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-landing-600">Kenapa adatelur</p>
          <h2 className="mt-4 text-[27px] font-bold leading-tight tracking-tight text-landing-text md:text-[36px]">
            Dibangun supaya kamu tenang
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-landing-desc md:text-[17px]">
            Aman, transparan, dan gampang dipakai untuk konsumen maupun peternak.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <article className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-lg border border-landing-border bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-md bg-landing-100 text-landing-700">
                <ShieldCheck className="h-[26px] w-[26px]" />
              </span>
              <h3 className="mt-auto text-[18px] font-extrabold text-landing-text">Peternak terverifikasi</h3>
              <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-landing-desc">
                Setiap peternak diperiksa dan disetujui dulu sebelum bisa berjualan, jadi kamu bisa belanja
                dengan tenang.
              </p>
              <img
                src="/landing/why-verify.svg"
                alt=""
                className="pointer-events-none absolute right-4 top-1/2 hidden w-[150px] -translate-y-1/2 md:block"
              />
            </article>
          </Reveal>

          <Reveal delay={80}>
            <article className="flex h-full min-h-[220px] flex-col rounded-lg border border-landing-border bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-md bg-landing-100 text-landing-700">
                <Star className="h-[26px] w-[26px]" />
              </span>
              <h3 className="mt-auto text-[18px] font-extrabold text-landing-text">Rating &amp; skor</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-landing-desc">
                Reputasi peternak terlihat jelas dari pengalaman pembeli asli.
              </p>
            </article>
          </Reveal>

          <Reveal delay={120}>
            <article className="flex h-full min-h-[220px] flex-col rounded-lg border border-landing-border bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-md bg-landing-100 text-landing-700">
                <Lock className="h-[26px] w-[26px]" />
              </span>
              <h3 className="mt-auto text-[18px] font-extrabold text-landing-text">Pembayaran aman</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-landing-desc">
                Transaksi tercatat rapi dengan alur konfirmasi yang jelas.
              </p>
            </article>
          </Reveal>

          <Reveal className="md:col-span-2" delay={80}>
            <article className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-lg border border-landing-950 bg-landing-950 p-8 shadow-sm transition-all duration-200 hover:-translate-y-1">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-md bg-landing-800 text-landing-300">
                <Smartphone className="h-[26px] w-[26px]" />
              </span>
              <h3 className="mt-auto text-[18px] font-extrabold text-white">Install jadi aplikasi</h3>
              <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-landing-200">
                Pasang adatelur di HP kamu tanpa perlu buka app store, ringan dan langsung siap dipakai.
              </p>
              <img
                src="/landing/why-install.svg"
                alt=""
                className="pointer-events-none absolute right-6 top-1/2 hidden w-[130px] -translate-y-1/2 md:block"
              />
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
