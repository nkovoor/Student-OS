'use client';

import Link from 'next/link';
import { PLACEHOLDER_IDENTITY, initialsFor } from '@/lib/placeholderIdentity';

// Profile screen, Part A: the one new global navigation surface — top-right
// of the header, present on all 5 tabs since Header itself already is.
// Full-screen route push to /profile (a real Next.js route, same pattern as
// every other tab), not a drawer/overlay — the app has none of those
// anywhere (see NextUpCard's own comment on modals).
export function Avatar() {
  return (
    <Link href="/profile" className="avatar-chip" aria-label="Open profile">
      {initialsFor(PLACEHOLDER_IDENTITY.name)}
    </Link>
  );
}
