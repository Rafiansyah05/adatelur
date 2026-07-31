import { Star } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

const testimonials = [
  {
    name: 'Siti Rahayu',
    role: 'Konsumen · Bandung',
    initials: 'SR',
    quote:
      'Telurnya beneran segar, dianter pagi-pagi. Harganya juga lebih murah dari pasar. Sekarang langganan.',
  },
  {
    name: 'Pak Budi',
    role: 'Peternak · Garut',
    initials: 'PB',
    quote:
      'Pesanan langsung masuk ke WhatsApp, gampang banget. Sekarang telur saya kejual tiap hari tanpa tengkulak.',
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <Reveal className="mx-auto max-w-[640px] text-center">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-landing-600">Testimoni</p>
          <h2 className="mt-4 text-[27px] font-bold leading-tight tracking-tight text-landing-text md:text-[36px]">
            Kata mereka yang sudah pakai
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((item, index) => (
            <Reveal key={item.name} delay={index * 80}>
              <article className="h-full rounded-lg border border-landing-border bg-white p-8 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star key={star} className="h-[18px] w-[18px] fill-landing-500 text-landing-500" />
                  ))}
                </div>
                <p className="mt-4 text-[17px] font-medium leading-relaxed text-landing-text">“{item.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-landing-200 text-[15px] font-extrabold text-landing-800">
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-[14px] font-extrabold text-landing-text">{item.name}</p>
                    <p className="text-[12px] text-landing-desc">{item.role}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
