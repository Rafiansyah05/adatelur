import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ChooseRolePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-[600px] text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image 
            src="/icons/icon-512x512.png" 
            alt="adatelur Logo" 
            width={48} 
            height={48} 
            className="rounded-sm object-contain"
          />
          <span className="text-[28px] font-extrabold text-neutral-900 tracking-tight">adatelur.</span>
        </div>
        
        <h1 className="text-[32px] font-extrabold text-neutral-900 mb-2 tracking-tight">Bergabung Bersama Kami</h1>
        <p className="text-neutral-500 mb-10 font-medium">Pilih peran Anda untuk melanjutkan pendaftaran</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 rounded-sm border border-neutral-100 bg-white hover:border-neutral-300 transition-none flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-sm flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Sebagai Konsumen</h2>
            <p className="text-sm text-neutral-500 mb-6 flex-1">Beli telur segar langsung dari peternak terdekat dengan harga terbaik.</p>
            <Link href="/register-consumer" className="w-full">
              <Button className="w-full bg-primary-400 border border-transparent hover:bg-primary-400 hover:border-primary-600 text-neutral-900 font-bold rounded-sm min-h-[48px] transition-none">Daftar Konsumen</Button>
            </Link>
          </Card>

          <Card className="p-8 rounded-sm border border-neutral-100 bg-white hover:border-neutral-300 transition-none flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-sm flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Sebagai Peternak</h2>
            <p className="text-sm text-neutral-500 mb-6 flex-1">Jual stok telur harian Anda langsung ke konsumen tanpa perantara.</p>
            <Link href="/register" className="w-full">
              <Button className="w-full bg-white border border-neutral-200 text-neutral-700 hover:bg-white hover:border-neutral-400 font-bold rounded-sm min-h-[48px] transition-none">Daftar Peternak</Button>
            </Link>
          </Card>
        </div>
        
        <div className="mt-8 text-sm text-neutral-500">
          Sudah punya akun? <Link href="/login" className="font-bold text-primary-600 hover:underline">Masuk</Link>
        </div>
      </div>
    </div>
  );
}
