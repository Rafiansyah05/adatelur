import { Home, Package, User } from 'lucide-react';
import { type NavItem } from '@/components/layout/DesktopSidebar';
import { RoleLayoutWrapper } from '@/components/layout/RoleLayoutWrapper';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const consumerNavItems: NavItem[] = [
  { label: 'Beranda', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: 'Pesanan Saya', href: '/orders', icon: <Package className="h-5 w-5" /> },
  { label: 'Akun', href: '/profile', icon: <User className="h-5 w-5" /> },
];

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayoutWrapper items={consumerNavItems}>{children}</RoleLayoutWrapper>;
}
