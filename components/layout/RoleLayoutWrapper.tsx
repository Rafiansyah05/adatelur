'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { DesktopSidebar, NavItem } from '@/components/layout/DesktopSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface RoleLayoutWrapperProps {
  children: React.ReactNode;
  items: NavItem[];
}

export function RoleLayoutWrapper({ children, items }: RoleLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Hide layout elements on auth/registration pages
  const isAuthPage = pathname.startsWith('/register') || pathname === '/login';

  if (isAuthPage) {
    return <div className="flex min-h-screen flex-col bg-cream">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white">
      <DesktopSidebar items={items} />
      
      <div className="flex flex-1 flex-col pb-16 md:ml-[240px] md:pb-0">
        <main className="mx-auto w-full max-w-[1040px] flex-1">
          {children}
        </main>
      </div>
      
      <MobileBottomNav items={items} />
    </div>
  );
}
