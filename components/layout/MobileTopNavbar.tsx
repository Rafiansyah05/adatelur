'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronLeft, Search } from 'lucide-react';
import { useState } from 'react';

export function MobileTopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // 1. Home Page Navbar
  if (pathname === '/') {
    return (
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-white px-4 md:hidden">
        {/* Kiri: Kosong (untuk balance spacing) */}
        <div className="w-10"></div>
        
        {/* Tengah: Logo dan Teks */}
        <div className="flex flex-1 justify-center items-center gap-2">
          <Image 
            src="/icons/icon-512x512.png" 
            alt="Adatelur" 
            width={32} 
            height={32} 
            className="object-contain"
          />
          <span className="text-xl font-bold text-text-main tracking-tight">adatelur.</span>
        </div>
        
        {/* Kanan: Kosong (untuk balance spacing) */}
        <div className="w-10"></div>
      </header>
    );
  }

  // 2. Search Page Navbar
  if (pathname === '/search') {
    return (
      <header className="sticky top-0 z-50 flex h-16 w-full items-center gap-3 bg-white px-4 shadow-sm md:hidden">
        <button onClick={() => router.back()} className="text-text-main">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <form onSubmit={handleSearch} className="relative flex-1">
          <input
            type="text"
            autoFocus
            placeholder="Cari peternak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-neutral-100 py-2.5 pl-10 pr-4 text-sm font-medium text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        </form>
      </header>
    );
  }

  // 3. Dynamic Title Navbars for other pages
  let title = '';
  let showBack = false;

  if (pathname.startsWith('/orders')) {
    title = 'Riwayat Order';
  } else if (pathname.startsWith('/profile')) {
    title = 'Profile';
  } else if (pathname.startsWith('/notifications')) {
    title = 'Notifikasi';
    showBack = true; // Sesuai instruksi: ada button backnya kalau diklik mengarah ke home
  } else if (pathname.startsWith('/help')) {
    title = 'Bantuan';
    showBack = true;
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-white px-4 md:hidden">
      <div className="w-10 flex justify-start">
        {showBack && (
          <button onClick={() => router.push('/')} className="text-text-main hover:bg-neutral-100 p-1 rounded-full">
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}
      </div>
      
      <div className="flex flex-1 justify-center">
        <span className="text-h3 font-bold text-text-main">{title}</span>
      </div>
      
      <div className="w-10"></div> {/* Spacer for center alignment */}
    </header>
  );
}
