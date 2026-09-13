'use client';

import { usePlan, useStudentOSData, useStudentOSActions } from '@/lib/state/StudentOSProvider';
import { CapacityRead } from '@/components/CapacityRead';
import { todayISO } from '@/lib/format';

// Spec §11: a glance-able sparkline built from plain CSS bars, deliberately
// not Chart.js (that's reserved for the Progress page's more analytical
// trend chart — see §12's note on why these are two separate implementations).
export function Next7DaysCard() {
  const plan = usePlan();
  const data = useStudentOSData();
  const { resetTodaysSkips } = useStudentOSActions();

  const today = todayISO();
  const hasSkipsToday = [...data.exams.flatMap((exam) => exam.topics), ...data.tasks].some((item) =>
    item.skipDates.includes(today)
  );

  const maxPlanned = Math.max(1, ...plan.days.map((day) => day.plannedMinutes));

  return (
    <div className="card">
      <div className="card-header-row">
        <h3 className="card-title">Next 7 days</h3>
        <CapacityRead capacityDelta={plan.capacityDelta} />
      </div>

      {hasSkipsToday && (
        <button type="button" className="mini-btn reset-skips-btn" onClick={resetTodaysSkips}>
          Reset today&rsquo;s skips
        </button>
      )}

      <div className="day-strip">
        {plan.days.map((day, index) => (
          <div className="day-strip-col" key={day.date}>
            <div
              className={'day-strip-bar' + (index === 0 ? ' is-today' : '')}
              style={{ height: `${(day.plannedMinutes / maxPlanned) * 100}%` }}
            />
            <span className="day-strip-day-label">{day.dayLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
