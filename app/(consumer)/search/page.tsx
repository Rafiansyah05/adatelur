'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { MapPin, Search as SearchIcon, ArrowRight } from 'lucide-react';
import Image from 'next/image';

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  
  const [q, setQ] = useState(initialQ);
  
  // Update local q if searchParams changes from outside (e.g. mobile navbar)
  useEffect(() => {
    setQ(searchParams.get('q') || '');
  }, [searchParams]);
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchResults() {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, peternak_details(farm_address)')
          .eq('role', 'peternak')
          .ilike('full_name', `%${q}%`)
          .limit(20);
          
        if (error) throw error;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData = (data || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          address: Array.isArray(p.peternak_details) ? (p.peternak_details[0] as any)?.farm_address : (p.peternak_details as any)?.farm_address
        }));
        
        setResults(formattedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mx-auto w-full max-w-4xl py-6 md:py-8">
      {/* Search Header for Desktop (Mobile has it in Navbar) */}
      <div className="hidden md:block mb-8">
        <h1 className="text-display text-text-main mb-4">Cari Peternak</h1>
        <div className="relative w-full max-w-2xl">
          <input
            type="text"
            autoFocus
            placeholder="Ketik nama peternak..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-full bg-white border border-neutral-200 py-4 pl-12 pr-4 text-lg font-medium text-text-main focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-400" />
        </div>
        
        {q && (
          <p className="text-body-medium text-text-desc mt-4">
            Menampilkan hasil untuk: <span className="font-bold text-text-main">&quot;{q}&quot;</span>
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((peternak) => (
            <Link key={peternak.id} href={`/peternak/${peternak.id}`}>
              <Card className="p-4 flex items-start gap-4 transition-all hover:border-primary-400 hover:shadow-md cursor-pointer h-full">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-100 overflow-hidden">
                  <Image 
                    src="/icons/icon-512x512.png" 
                    alt="Peternak" 
                    width={40} 
                    height={40} 
                    className="opacity-50 grayscale"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-body-medium font-bold text-text-main mb-1 line-clamp-1">{peternak.full_name}</h3>
                  <div className="flex items-start gap-1 text-text-desc text-xs line-clamp-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{peternak.address || 'Alamat belum tersedia'}</span>
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-text-desc mt-4">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : q ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <SearchIcon className="h-8 w-8" />
          </div>
          <h3 className="text-h3 text-text-main mb-2">Pencarian Tidak Ditemukan</h3>
          <p className="text-body-small text-text-desc max-w-sm">
            Maaf, kami tidak menemukan peternak dengan nama &quot;{q}&quot;. Coba gunakan kata kunci lain.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-body-medium text-text-desc">Silakan masukkan nama peternak untuk memulai pencarian.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-desc">Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
