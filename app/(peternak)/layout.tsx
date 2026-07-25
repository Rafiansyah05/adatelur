import { LayoutDashboard, Store, Inbox, User } from 'lucide-react';
import { type NavItem } from '@/components/layout/TopNavbar';
import { RoleLayoutWrapper } from '@/components/layout/RoleLayoutWrapper';

const peternakNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Atur Ketersediaan', href: '/dashboard/availability', icon: <Store className="h-5 w-5" /> },
  { label: 'Pesanan Masuk', href: '/dashboard/orders', icon: <Inbox className="h-5 w-5" /> },
  { label: 'Akun', href: '/dashboard/profile', icon: <User className="h-5 w-5" /> },
];

export default function PeternakLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayoutWrapper items={peternakNavItems}>{children}</RoleLayoutWrapper>;
}
