import { Home, Package, User } from 'lucide-react';
import { DesktopSidebar, NavItem } from '@/components/layout/DesktopSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { RoleLayoutWrapper } from '@/components/layout/RoleLayoutWrapper';

const consumerNavItems: NavItem[] = [
  { label: 'Beranda', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: 'Pesanan Saya', href: '/orders', icon: <Package className="h-5 w-5" /> },
  { label: 'Akun', href: '/profile', icon: <User className="h-5 w-5" /> },
];

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayoutWrapper items={consumerNavItems}>
      {children}
    </RoleLayoutWrapper>
  );
}
