import Link from 'next/link';
import Image from 'next/image';
import { Reveal } from '@/components/landing/Reveal';

const footerColumns = [
  {
    title: 'Produk',
    links: ['Cari Peternak', 'Jadi Peternak', 'Cara Kerja', 'Install App'],
  },
  {
    title: 'Bantuan',
    links: ['Pusat Bantuan', 'FAQ', 'Hubungi Kami', 'WhatsApp'],
  },
  {
    title: 'Perusahaan',
    links: ['Tentang', 'Kebijakan Privasi', 'Syarat & Ketentuan'],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-landing-border bg-landing-cream pt-14 pb-8">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6">
        <Reveal className="grid gap-10 md:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/icons/icon-512x512.png"
                alt="adatelur"
                width={36}
                height={36}
                className="rounded-md object-contain"
              />
              <span className="text-[21px] font-extrabold tracking-tight text-landing-text">adatelur.</span>
            </Link>
            <p className="mt-4 max-w-[290px] text-[14px] leading-relaxed text-landing-desc">
              Marketplace telur yang menghubungkan konsumen dengan peternak ayam petelur terverifikasi di
              seluruh Indonesia.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-landing-text">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link href="/" className="text-[14px] text-landing-desc transition-colors hover:text-landing-700">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>

        <div className="mt-12 flex flex-col gap-3 border-t border-landing-border pt-6 text-[13px] text-landing-desc md:flex-row md:items-center md:justify-between">
          <span>© 2026 adatelur. Seluruh hak cipta dilindungi.</span>
          <span>Peternak Senang, Konsumen Tenang.</span>
        </div>
      </div>
    </footer>
  );
}
