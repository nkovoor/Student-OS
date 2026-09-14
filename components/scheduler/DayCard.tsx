'use client';

import type { PlanDay } from '@/lib/engine';
import { subjectColor } from '@/lib/format';
import { useTheme } from '@/lib/theme';
import { ReasonText } from '@/components/ReasonText';

// Parsed and formatted as UTC explicitly — the engine's dates are UTC-anchored
// strings (see lib/engine/dateUtils.ts), so formatting in the viewer's local
// timezone without pinning to UTC could shift the displayed day by one for
// anyone west of UTC.
function formatDayMeta(dateISO: string, plannedMinutes: number): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  const monthDay = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' });
  return `${monthDay} · ${plannedMinutes}m planned`;
}

// One day-card per day in the 7-day plan (spec §11). The "today" card gets
// the accent-ring treatment from §7 so it's unmistakable while scrolling.
export function DayCard({ day, isToday }: { day: PlanDay; isToday: boolean }) {
  const { theme } = useTheme();
  return (
    <div className={'day-card' + (isToday ? ' is-today' : '')}>
      <div className="day-card-header">
        <span className="day-card-name">{day.dayLabel}</span>
        <span className="day-card-meta">{formatDayMeta(day.date, day.plannedMinutes)}</span>
      </div>
      <div className="day-card-body">
        {day.isFree ? (
          <p className="muted-note">Free — no work scheduled</p>
        ) : (
          day.blocks.map((block) => (
            <div key={block.itemId}>
              <div className="block-row">
                <span className="dot" style={{ background: subjectColor(block.subject, theme) }} />
                <span className="block-row-label">{block.label}</span>
                <span className="block-row-minutes">{block.minutes}m</span>
              </div>
              <ReasonText reason={block.reason} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
