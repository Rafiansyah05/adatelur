'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from './TopNavbar';

export function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  
  if (pathname.startsWith('/recommendations')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-border bg-white md:hidden">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-primary-400' : 'text-text-desc'
            }`}
          >
            <span className={isActive ? 'text-primary-400' : 'text-text-desc'}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-600' : 'text-text-desc'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
