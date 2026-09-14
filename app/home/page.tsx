'use client';

import { useStudentOSData } from '@/lib/state/StudentOSProvider';
import { NextUpCard } from '@/components/home/NextUpCard';
import { ThenTodayCard } from '@/components/home/ThenTodayCard';
import { Next7DaysCard } from '@/components/home/Next7DaysCard';
import { CompletionCard } from '@/components/home/CompletionCard';
import { StatCard } from '@/components/home/StatCard';
import { WeeklyRecapBanner } from '@/components/home/WeeklyRecapBanner';
import { thisWeekBySubject, thisWeekTotalMinutes } from '@/lib/weekStats';
import { thisWeekXp, hasPastWeekToRecap, buildWeeklyRecap, computeStreak } from '@/lib/gamification';
import { todayISO } from '@/lib/format';

// Home (spec §11): the hero screen — next task, then-today list, 7-day
// glance strip with capacity read, this-week completion doughnut, stat row.
// Part F.4's weekly recap sits above all of it when one is due, since it's
// meant to be the first thing seen "when the student opens the app."
export default function HomePage() {
  const data = useStudentOSData();
  const today = todayISO();
  const entries = thisWeekBySubject(data.completionLog);
  const total = thisWeekTotalMinutes(data.completionLog);
  const weekXp = thisWeekXp(data.xpLog, today);

  const showRecap = !data.weeklyRecapDismissed && hasPastWeekToRecap(data.completionLog, today);
  const recap = showRecap
    ? buildWeeklyRecap(data.xpLog, data.completionLog, computeStreak(data.completionLog, today), today)
    : null;

  return (
    <>
      {recap && <WeeklyRecapBanner recap={recap} />}
      <NextUpCard />
      <ThenTodayCard />
      <Next7DaysCard />
      <CompletionCard entries={entries} />
      <StatCard totalMinutes={total} weekXp={weekXp} />
    </>
  );
}
