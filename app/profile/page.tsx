'use client';

import Link from 'next/link';
import { useStudentOSData } from '@/lib/state/StudentOSProvider';
import { xpToLevel, computeStreak } from '@/lib/gamification';
import { todayISO } from '@/lib/format';
import { IdentityBlock } from '@/components/profile/IdentityBlock';
import { LevelHeroCard } from '@/components/profile/LevelHeroCard';
import { ArchetypeLadder } from '@/components/profile/ArchetypeLadder';
import { StatsChips } from '@/components/profile/StatsChips';
import { SubjectProgressCard } from '@/components/profile/SubjectProgressCard';
import { SettingsCard } from '@/components/profile/SettingsCard';

// Profile screen (Part B): reached only via the header avatar — not a tab,
// per the brief ("the avatar is the only new navigation surface"). Layout,
// top to bottom: back link, identity block, Level Hero Card, Archetype
// Ladder, stats chips, Subject Progress, Settings.
export default function ProfilePage() {
  const data = useStudentOSData();
  const progress = xpToLevel(data.totalXp);
  const streak = computeStreak(data.completionLog, todayISO());
  // "Days active" — count of distinct dates with at least one completion,
  // the same activeDates set computeStreak derives internally, surfaced
  // here as a lifetime total rather than a consecutive-run count.
  const daysActive = new Set(data.completionLog.map((entry) => entry.date)).size;

  return (
    <>
      <Link href="/home" className="profile-back-link">
        &larr; back to Home
      </Link>
      <IdentityBlock />
      <LevelHeroCard progress={progress} />
      <ArchetypeLadder level={progress.level} />
      <StatsChips streak={streak} totalXp={data.totalXp} daysActive={daysActive} />
      <SubjectProgressCard subjectXp={data.subjectXp} />
      <SettingsCard />
    </>
  );
}
