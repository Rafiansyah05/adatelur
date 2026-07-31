import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LandingPage } from '@/components/landing/LandingPage';

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      redirect('/admin/dashboard');
    }
    if (profile?.role === 'peternak') {
      redirect('/dashboard');
    }
    redirect('/beranda');
  }

  return <LandingPage />;
}
