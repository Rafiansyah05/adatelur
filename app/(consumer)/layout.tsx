import { Home, Package, User, Search } from 'lucide-react';
import { type NavItem } from '@/components/layout/TopNavbar';
import { RoleLayoutWrapper } from '@/components/layout/RoleLayoutWrapper';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GlobalWaitingModal } from '@/components/ui/GlobalWaitingModal';
import { GlobalUnpaidToast } from '@/components/ui/GlobalUnpaidToast';

const consumerNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: 'Search', href: '/search', icon: <Search className="h-5 w-5" /> },
  { label: 'Riwayat Order', href: '/orders', icon: <Package className="h-5 w-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
];

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RoleLayoutWrapper items={consumerNavItems}>{children}</RoleLayoutWrapper>
      <GlobalWaitingModal />
      <GlobalUnpaidToast />
    </>
  );
}
