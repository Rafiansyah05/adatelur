'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, User, X, MapPin, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PeternakDetailModal } from '@/components/ui/PeternakDetailModal';
import { IncomingOrderBadge } from '@/components/peternak/IncomingOrderBadge';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export function TopNavbar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();


  const [showSearchSidebar, setShowSearchSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPeternakForModal, setSelectedPeternakForModal] = useState<any>(null);

  const supabase = createClient();

  const isConsumer = !pathname.startsWith('/dashboard');

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
          .select('id, full_name, avatar_url, peternak_details(farm_address)')
          .eq('role', 'peternak')
          .ilike('full_name', `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData = (data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
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

    const timer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <>
      <div className="hidden md:block h-[76px] w-full shrink-0" />

      <header className={`fixed top-0 left-0 right-0 z-40 hidden w-full items-center justify-between bg-white px-6 py-4 md:flex ${!isConsumer ? 'border-b border-border shadow-sm' : ''}`}>
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

        <nav className="flex items-center gap-8">
          {(isConsumer
            ? items.filter((item) => item.href === '/' || item.href === '/orders')
            : items.filter((item) => item.href !== '/dashboard/profile')
          ).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative py-2 text-sm font-semibold transition-colors"
              >
                <span className={isActive ? 'text-text-main flex items-center relative' : 'text-neutral-500 hover:text-text-main flex items-center relative'}>
                  {item.label}
                  {item.href === '/dashboard/orders' && <IncomingOrderBadge />}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] rounded-t-full bg-text-main" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-5">
          {isConsumer ? (
            <>
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



              <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-text-main hover:bg-neutral-200 transition-colors">
                <User className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                aria-label="Akun"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-text-main hover:bg-neutral-200 transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>
            </div>
          )}
        </div>
      </header>

      {isConsumer && (
        <>
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${showSearchSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowSearchSidebar(false)}
            />
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
                            setSelectedPeternakForModal(peternak);
                          }}
                          className="flex items-start gap-4 rounded-xl border border-neutral-100 p-4 transition-all hover:border-primary-400 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 border border-primary-100 text-primary-900 font-bold text-sm overflow-hidden">
                            {peternak.avatar_url ? (
                              <img 
                                src={peternak.avatar_url} 
                                alt={peternak.full_name} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{peternak.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                            )}
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


          
          <PeternakDetailModal
            isOpen={!!selectedPeternakForModal}
            onClose={() => setSelectedPeternakForModal(null)}
            peternak={selectedPeternakForModal}
          />
        </>
      )}
    </>
  );
}
