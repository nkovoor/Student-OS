'use client';

import { useStudentOSData } from '@/lib/state/StudentOSProvider';
import { NextUpCard } from '@/components/home/NextUpCard';
import { ThenTodayCard } from '@/components/home/ThenTodayCard';
import { Next7DaysCard } from '@/components/home/Next7DaysCard';
import { CompletionCard } from '@/components/home/CompletionCard';
import { StatCard } from '@/components/home/StatCard';
import { thisWeekBySubject, thisWeekTotalMinutes } from '@/lib/weekStats';
import { thisWeekXp } from '@/lib/gamification';
import { todayISO } from '@/lib/format';

// Home (spec §11): the hero screen — next task, then-today list, 7-day
// glance strip with capacity read, this-week completion doughnut, stat row.
export default function HomePage() {
  const data = useStudentOSData();
  const entries = thisWeekBySubject(data.completionLog);
  const total = thisWeekTotalMinutes(data.completionLog);
  const weekXp = thisWeekXp(data.xpLog, todayISO());

  return (
    <>
      <NextUpCard />
      <ThenTodayCard />
      <Next7DaysCard />
      <CompletionCard entries={entries} />
      <StatCard totalMinutes={total} weekXp={weekXp} />
    </>
  );
}
