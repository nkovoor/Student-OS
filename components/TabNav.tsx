'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// All five tabs (spec §2's order, spec §11). Real Next.js routes rather than
// client-side tab-switching, so each is a standalone page.
const TABS = [
  { href: '/home', label: 'Home' },
  { href: '/activities', label: 'Activities' },
  { href: '/scheduler', label: 'Scheduler' },
  { href: '/progress', label: 'Progress' },
  { href: '/availability', label: 'Availability' },
] as const;

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="tab-nav" role="tablist" aria-label="Sections">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={'tab-btn' + (isActive ? ' is-active' : '')}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
