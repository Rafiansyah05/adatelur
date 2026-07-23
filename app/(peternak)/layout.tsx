import { LayoutDashboard, Inbox, User } from 'lucide-react';
import { type NavItem } from '@/components/layout/DesktopSidebar';
import { RoleLayoutWrapper } from '@/components/layout/RoleLayoutWrapper';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const peternakNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Pesanan Masuk', href: '/dashboard/orders', icon: <Inbox className="h-5 w-5" /> },
  { label: 'Akun', href: '/dashboard/profile', icon: <User className="h-5 w-5" /> },
];

export default function PeternakLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayoutWrapper items={peternakNavItems}>{children}</RoleLayoutWrapper>;
}
