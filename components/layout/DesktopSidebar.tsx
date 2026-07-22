'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function DesktopSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[240px] flex-col border-r border-border bg-white md:flex">
      <div className="flex h-16 items-center px-6">
        <span className="text-h2 font-bold text-primary-400">adatelur.</span>
      </div>
      <nav className="flex flex-1 flex-col gap-2 px-4 py-4">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-4 py-3 text-body-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-main hover:bg-cream'
              }`}
            >
              <span className={isActive ? 'text-primary-600' : 'text-text-desc'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
