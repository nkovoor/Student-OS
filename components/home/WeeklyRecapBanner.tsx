'use client';

import { useStudentOSActions } from '@/lib/state/StudentOSProvider';
import type { WeeklyRecap } from '@/lib/gamification';

// Part F.4: a single calm summary shown once (per session, for now — see
// lib/gamification.ts's weekly-recap comment on the persistence gap) when a
// genuine prior week of activity exists. No push notification, no recurring
// nag pattern — a plain dismissible card, same visual language as every
// other card on Home, not a popup (the app has none anywhere).
export function WeeklyRecapBanner({ recap }: { recap: WeeklyRecap }) {
  const { dismissWeeklyRecap } = useStudentOSActions();

  return (
    <div className="card recap-banner">
      <div className="card-header-row">
        <h3 className="card-title">Last week&rsquo;s recap</h3>
        <button type="button" className="recap-dismiss-btn" aria-label="Dismiss recap" onClick={dismissWeeklyRecap}>
          ×
        </button>
      </div>
      <p className="muted-note">
        {recap.xpEarned} XP earned · {recap.streak}-day streak
        {recap.subjectBalance.length > 0 ? ` · Studied ${recap.subjectBalance.map((s) => s.subject).join(', ')}` : ''}
      </p>
    </div>
  );
}
