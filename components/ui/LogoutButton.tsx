'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export function LogoutButton({ isMobile = false }: { isMobile?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setLoading(false);
    
    // Refresh the router to trigger middleware redirects, or push directly to login
    router.push('/login');
    router.refresh();
  };

  if (isMobile) {
    return (
      <button 
        onClick={handleLogout} 
        disabled={loading}
        className="flex items-center justify-center p-2 text-text-desc hover:text-text-main transition-colors"
        aria-label="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-body-medium text-text-desc hover:bg-cream hover:text-text-main transition-colors"
    >
      <LogOut className="w-5 h-5" />
      <span>{loading ? 'Keluar...' : 'Keluar'}</span>
    </button>
  );
}
