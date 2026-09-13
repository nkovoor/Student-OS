'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Only the two tabs built so far (spec §11 Activities + Availability). Real
// Next.js routes rather than client-side tab-switching, so each is a
// standalone page; Home/Scheduler/Progress are a one-line addition later.
const TABS = [
  { href: '/activities', label: 'Activities' },
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
