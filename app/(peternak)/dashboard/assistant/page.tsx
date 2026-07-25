import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AssistantChat } from '@/components/peternak/AssistantChat';

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

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-display text-text-main">Asisten AI</h1>
        <p className="text-body text-text-desc mt-1">
          Asisten operasional untuk membantu keseharian peternakan Anda.
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
