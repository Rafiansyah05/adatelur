import Link from 'next/link';
import Image from 'next/image';
import { Egg, Banknote, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

const features = [
  { icon: Egg, title: 'Segar harian', description: 'Telur dari produksi hari itu, bukan stok gudang berminggu-minggu.' },
  { icon: Banknote, title: 'Harga transparan', description: 'Harga per rak jelas di depan, ongkir kelihatan sebelum pesan.' },
  { icon: ShieldCheck, title: 'Peternak terverifikasi', description: 'Setiap peternak dicek dulu sebelum bisa berjualan.' },
  { icon: Truck, title: 'Antar atau ambil', description: 'Pilih diantar ke rumah atau ambil sendiri sesuai slot.' },
];

export function ForConsumer() {
  return (
    <section id="konsumen" className="scroll-mt-24 bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-5 md:grid-cols-2 md:gap-14 md:px-6">
        <div>
          <Reveal>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-landing-600">Untuk Konsumen</p>
            <h2 className="mt-4 text-[27px] font-bold leading-tight tracking-tight text-landing-text md:text-[36px]">
              Telur berkualitas tanpa ribet
            </h2>
            <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-landing-desc md:text-[17px]">
              Belanja telur langsung dari sumbernya. Lebih segar, harga lebih jujur, dan kamu tahu persis
              dari mana telurmu berasal.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 100}>
                <div className="flex gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-landing-100 text-landing-700">
                    <feature.icon className="h-[22px] w-[22px]" />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-extrabold text-landing-text">{feature.title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-landing-desc">{feature.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-9" delay={200}>
            <Link
              href="/register-consumer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-landing-400 px-6 py-4 text-[15px] font-bold text-landing-950 transition-all hover:-translate-y-0.5 hover:bg-landing-500 active:scale-[.98]"
            >
              Belanja Sekarang
              <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <Image
            src="/icons/konsumen.jpg"
            alt="Konsumen menerima telur segar"
            width={640}
            height={560}
            className="h-auto w-full rounded-lg object-cover shadow-lg"
          />
        </Reveal>
      </div>
    </section>
  );
}
