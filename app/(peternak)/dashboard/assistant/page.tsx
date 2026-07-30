import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AssistantChat } from '@/components/peternak/AssistantChat';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AssistantPage() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: peternakDetail } = await supabase
    .from('peternak_details')
    .select('verification_status')
    .eq('profile_id', user.id)
    .single();

  if (!peternakDetail) {
    redirect('/peternak/register');
  }

  if (peternakDetail.verification_status !== 'approved') {
    redirect('/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.trim().split(' ')[0] || '';

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-bg-base">
      <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between bg-white px-4 py-3 shadow-sm border-b border-border">
        <Link href="/dashboard" className="rounded-full p-2 hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-text-main" />
        </Link>
        <h1 className="text-lg font-bold text-text-main absolute left-1/2 -translate-x-1/2">
          AdaSisten
        </h1>
        <div className="w-9" />
      </header>

      <main className="flex-1 min-h-0 w-full max-w-3xl mx-auto flex flex-col p-4 overflow-hidden">
        <AssistantChat firstName={firstName} />
      </main>
    </div>
  );
}
