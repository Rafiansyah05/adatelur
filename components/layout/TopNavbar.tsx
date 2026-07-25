'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, User, X, MapPin, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { createClient } from '@/lib/supabase/client';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export function TopNavbar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const [showNotifSidebar, setShowNotifSidebar] = useState(false);
  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const supabase = createClient();

  // Check if we are in consumer or peternak layout
  const isConsumer = !pathname.startsWith('/dashboard');

  // Search logic for sidebar
  useEffect(() => {
    async function fetchResults() {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, peternak_details(farm_address)')
          .eq('role', 'peternak')
          .ilike('full_name', `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData = (data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          address: Array.isArray(p.peternak_details) ? (p.peternak_details[0] as any)?.farm_address : (p.peternak_details as any)?.farm_address
        }));

        setSearchResults(formattedData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }

    // Debounce search
    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <>
      {/* Spacer untuk mengkompensasi fixed navbar + margin-bottom 40px pada desktop */}
      <div className="hidden md:block h-[40px] w-full shrink-0" />

      <header className={`fixed top-0 left-0 right-0 z-40 hidden w-full items-center justify-between bg-white px-6 py-4 md:flex ${!isConsumer ? 'border-b border-border shadow-sm' : ''}`}>
        {/* Kiri: Logo + Text */}
        <Link href={isConsumer ? '/' : '/dashboard'} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Image
            src="/icons/icon-512x512.png"
            alt="Adatelur Logo"
            width={36}
            height={36}
            className="rounded-lg object-contain"
          />
          <span className="text-xl font-bold text-text-main tracking-tight">adatelur.</span>
        </Link>

        {/* Tengah: Navigasi */}
        <nav className="flex items-center gap-8">
          {(isConsumer ? items.filter(item => item.href === '/' || item.href === '/orders') : items).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            if (isConsumer) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative py-2 text-sm font-semibold transition-colors"
                >
                  <span className={isActive ? 'text-text-main' : 'text-neutral-500 hover:text-text-main'}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] rounded-t-full bg-text-main" />
                  )}
                </Link>
              );
            } else {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-body-medium transition-colors ${isActive
                    ? 'text-primary-500 border-b-2 border-primary-500 pb-1'
                    : 'text-text-desc hover:text-text-main'
                    }`}
                >
                  {item.label}
                </Link>
              );
            }
          })}
        </nav>

        {/* Kanan */}
        <div className="flex items-center gap-5">
          {isConsumer ? (
            <>
              {/* Searchbar Toggle */}
              <div
                onClick={() => setShowSearchSidebar(true)}
                className="relative w-64 cursor-pointer"
              >
                <div className="w-full rounded-full bg-neutral-100 py-2.5 pl-10 pr-4 text-sm font-medium text-neutral-500 hover:bg-neutral-200 transition-colors flex items-center">
                  Cari peternak...
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Search className="h-4 w-4" />
                </div>
              </div>

              {/* Notifikasi Toggle */}
              <button
                onClick={() => setShowNotifSidebar(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-text-main hover:bg-neutral-200 transition-colors"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger"></span>
              </button>

              {/* Akun */}
              <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-text-main hover:bg-neutral-200 transition-colors">
                <User className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <LogoutButton />
          )}
        </div>
      </header>

      {/* OVERLAYS & SIDEBARS */}
      {isConsumer && (
        <>
          {/* SEARCH SIDEBAR */}
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${showSearchSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Backdrop Blur */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowSearchSidebar(false)}
            />
            {/* Sidebar Panel */}
            <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-in-out ${showSearchSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-neutral-100 p-6">
                  <h2 className="text-xl font-bold text-text-main">Pencarian</h2>
                  <button onClick={() => setShowSearchSidebar(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 pb-2 border-b border-neutral-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik nama peternak..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl bg-neutral-100 py-3 pl-10 pr-4 text-sm font-medium text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      autoFocus={showSearchSidebar}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {isSearching ? (
                    <div className="flex justify-center py-10">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {searchResults.map((peternak) => (
                        <div
                          key={peternak.id}
                          onClick={() => {
                            setShowSearchSidebar(false);
                            router.push(`/peternak/${peternak.id}`);
                          }}
                          className="flex items-start gap-4 rounded-xl border border-neutral-100 p-4 transition-all hover:border-primary-400 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                            <Image
                              src="/icons/icon-512x512.png"
                              alt="Peternak"
                              width={24}
                              height={24}
                              className="opacity-60 grayscale"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-text-main line-clamp-1">{peternak.full_name}</h3>
                            <div className="flex items-start gap-1 text-neutral-500 text-xs mt-1">
                              <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{peternak.address || 'Alamat tidak tersedia'}</span>
                            </div>
                          </div>
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-400">
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Search className="h-10 w-10 text-neutral-300 mb-3" />
                      <p className="text-sm font-medium text-text-main">Tidak ditemukan</p>
                      <p className="text-xs text-neutral-500 mt-1 max-w-[200px]">Coba gunakan kata kunci lain untuk mencari peternak.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-sm text-neutral-400">Silakan ketik nama peternak untuk memulai pencarian.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* NOTIFICATION SIDEBAR */}
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${showNotifSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Backdrop Blur */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowNotifSidebar(false)}
            />
            {/* Sidebar Panel */}
            <div className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out ${showNotifSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-neutral-100 p-6">
                  <h2 className="text-xl font-bold text-text-main">Notifikasi</h2>
                  <button onClick={() => setShowNotifSidebar(false)} className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl bg-primary-50 p-4 border border-primary-100 cursor-pointer hover:bg-primary-100 transition-colors" onClick={() => {
                      setShowNotifSidebar(false);
                      router.push('/notifications');
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                        <p className="font-bold text-primary-900 text-sm">Pesanan Diterima!</p>
                      </div>
                      <p className="text-primary-700 text-xs pl-4">Peternak &quot;Sinar Terang&quot; sedang menyiapkan pesanan Anda.</p>
                      <p className="text-[10px] text-primary-500 mt-2 pl-4">Baru saja</p>
                    </div>

                    <div className="rounded-xl bg-white p-4 border border-neutral-100">
                      <p className="font-bold text-text-main text-sm mb-1">Selamat datang di Adatelur</p>
                      <p className="text-neutral-500 text-xs">Mulai cari peternak telur terdekat dan lakukan pesanan pertamamu.</p>
                      <p className="text-[10px] text-neutral-400 mt-2">1 hari yang lalu</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowNotifSidebar(false);
                      router.push('/notifications');
                    }}
                    className="mt-6 w-full rounded-full border border-neutral-200 py-2.5 text-center text-sm font-semibold text-text-main hover:bg-neutral-50 transition-colors"
                  >
                    Lihat Semua Notifikasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
