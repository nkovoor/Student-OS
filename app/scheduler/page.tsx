'use client';

import { usePlan } from '@/lib/state/StudentOSProvider';
import { DayCard } from '@/components/scheduler/DayCard';

// Scheduler (spec §11): the full 7-day plan, one card per day, not just
// today's slice.
export default function SchedulerPage() {
  const plan = usePlan();

  return (
    <>
      {plan.days.map((day, index) => (
        <DayCard key={day.date} day={day} isToday={index === 0} />
      ))}
    </>
  );
}
