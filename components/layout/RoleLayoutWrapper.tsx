'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { TopNavbar, type NavItem } from '@/components/layout/TopNavbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileTopNavbar } from '@/components/layout/MobileTopNavbar';

interface RoleLayoutWrapperProps {
  children: React.ReactNode;
  items: NavItem[];
}

export function RoleLayoutWrapper({ children, items }: RoleLayoutWrapperProps) {
  const pathname = usePathname();

  const isNoLayoutPage =
    pathname.startsWith('/register') ||
    pathname === '/login' ||
    pathname.startsWith('/checkout') ||
    pathname === '/dashboard/assistant';

  if (isNoLayoutPage) {
    return <div className="flex min-h-screen flex-col bg-bg-base">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base overflow-x-clip">
      {pathname !== '/dashboard/wallet' && <TopNavbar items={items} />}
      {!pathname.startsWith('/recommendations') && <MobileTopNavbar />}

      <div className="flex flex-1 flex-col pb-20 md:pb-8">
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <MobileBottomNav items={items} />
    </div>
  );
}
