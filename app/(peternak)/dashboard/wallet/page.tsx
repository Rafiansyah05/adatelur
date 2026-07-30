import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WalletView } from '@/components/peternak/WalletView';
import { WalletCard } from '@/components/peternak/WalletCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-20 relative">
      {/* Header / Navbar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md flex items-center gap-4 py-4 mb-6 border-b border-neutral-100 -mt-6 -mx-4 px-4 md:-mt-8 md:-mx-8 md:px-8">
        <Link 
          href="/dashboard"
          className="flex shrink-0 items-center justify-center rounded-full p-2 hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-main" />
        </Link>
        <h1 className="text-xl md:text-2xl font-black text-neutral-900">Detail Transaksi dan Saldo</h1>
      </div>

      <WalletView />
    </div>
  );
}
