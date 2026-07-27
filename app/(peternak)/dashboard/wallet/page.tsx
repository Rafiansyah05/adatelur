import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WalletView } from '@/components/peternak/WalletView';

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
    <div className="w-full max-w-2xl">
      <h1 className="text-h1 text-text-main mb-6">Saldo</h1>
      <WalletView />
    </div>
  );
}
