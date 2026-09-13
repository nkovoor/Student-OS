'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Forces the <main> element to remount (and its CSS entrance animation to
// replay) on every route change, matching spec §9's "fades and rises in on
// every render" for tab switches. It deliberately does NOT replay on every
// in-page state change (adding an exam, clicking Done) — the original
// vanilla-JS prototype's full-DOM-rebuild model made that the same thing as
// a tab switch, but replaying a 0.28s animation on every click in React
// would read as flicker, not "quiet confidence" (spec §3).
export function AnimatedMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="main-content" key={pathname}>
      {children}
    </main>
  );
}
