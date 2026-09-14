'use client';

import { useStudentOSData } from '@/lib/state/StudentOSProvider';
import { OverallStatCard } from '@/components/progress/OverallStatCard';
import { WeeklyTrendCard } from '@/components/progress/WeeklyTrendCard';
import { SubjectBreakdownCard } from '@/components/progress/SubjectBreakdownCard';
import { ExamReadinessSection } from '@/components/progress/ExamReadinessSection';
import { overallWorkload, weeklyTrend, examReadiness } from '@/lib/progressStats';
import { thisWeekBySubject } from '@/lib/weekStats';
import { todayISO } from '@/lib/format';

// Progress (spec §11): overall workload stat, 4-week trend, this-week-by-
// subject, exam readiness. Data-only — no XP/level/streak here, that's the
// header's job (spec: "Progress stays data-only, per the original scope").
export default function ProgressPage() {
  const data = useStudentOSData();
  const today = todayISO();

  const workload = overallWorkload(data.exams, data.tasks);
  const trend = weeklyTrend(data.completionLog, today);
  const subjectEntries = thisWeekBySubject(data.completionLog, today);
  const readiness = examReadiness(data.exams, today);

  return (
    <>
      <OverallStatCard workload={workload} />
      <WeeklyTrendCard points={trend} />
      <SubjectBreakdownCard entries={subjectEntries} />
      <ExamReadinessSection entries={readiness} />
    </>
  );
}
