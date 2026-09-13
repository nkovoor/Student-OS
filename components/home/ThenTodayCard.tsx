'use client';

import { usePlan } from '@/lib/state/StudentOSProvider';
import { subjectColor } from '@/lib/format';
import { ReasonText } from '@/components/ReasonText';

// Spec §11: only rendered if more than one item is scheduled today — the
// hero card already shows the first one.
export function ThenTodayCard() {
  const plan = usePlan();
  const restToday = plan.days[0]?.blocks.slice(1) ?? [];

  if (restToday.length === 0) return null;

  return (
    <div className="card">
      <h3 className="card-title">Then today</h3>
      {restToday.map((block) => (
        <div key={block.itemId}>
          <div className="block-row">
            <span className="dot" style={{ background: subjectColor(block.subject) }} />
            <span className="block-row-label">{block.label}</span>
            <span className="block-row-minutes">{block.minutes}m</span>
          </div>
          <ReasonText reason={block.reason} />
        </div>
      ))}
    </div>
  );
}
