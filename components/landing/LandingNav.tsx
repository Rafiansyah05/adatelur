'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

const sections = [
  { label: 'Cara Kerja', href: '#cara-kerja' },
  { label: 'Untuk Konsumen', href: '#konsumen' },
  { label: 'Untuk Peternak', href: '#peternak' },
  { label: 'FAQ', href: '#faq' },
];

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('scroll-smooth');
    return () => document.documentElement.classList.remove('scroll-smooth');
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-landing-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1160px] items-center justify-between px-5 md:px-6">
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

        <nav className="hidden items-center gap-8 md:flex">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="text-[14px] font-semibold text-landing-desc transition-colors hover:text-landing-text"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-md border border-landing-border px-5 py-2.5 text-[14px] font-bold text-landing-text transition-colors hover:border-landing-400 md:inline-flex"
          >
            Masuk
          </Link>
          <Link
            href="/choose-role"
            className="rounded-md bg-landing-400 px-5 py-2.5 text-[14px] font-bold text-landing-950 transition-all hover:-translate-y-0.5 hover:bg-landing-500 active:scale-[.98]"
          >
            Daftar
          </Link>
          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-md border border-landing-border text-landing-text md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-landing-border bg-white px-5 pb-5 md:hidden">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-landing-border py-3.5 text-[15px] font-semibold text-landing-text"
            >
              {section.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-4 block rounded-md border border-landing-border py-3 text-center text-[15px] font-bold text-landing-text"
          >
            Masuk
          </Link>
        </nav>
      )}
    </header>
  );
}
