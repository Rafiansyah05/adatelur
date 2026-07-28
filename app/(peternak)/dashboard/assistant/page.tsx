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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.trim().split(' ')[0] || '';

  return (
    <div className="w-full">
      <AssistantChat firstName={firstName} />
    </div>
  );
}
