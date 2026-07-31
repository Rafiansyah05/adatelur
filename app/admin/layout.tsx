import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import '@/app/globals.css';

export const metadata = {
  title: 'Adatelur Admin',
  description: 'Panel Admin Adatelur',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  );
}
