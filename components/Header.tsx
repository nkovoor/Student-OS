'use client';

import { useEffect, useState } from 'react';
import { useStudentOSData } from '@/lib/state/StudentOSProvider';
import { xpToLevel, computeStreak } from '@/lib/gamification';
import { todayISO } from '@/lib/format';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { StreakIndicator } from '@/components/gamification/StreakIndicator';
import { XPBar } from '@/components/gamification/XPBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar } from '@/components/Avatar';

// Greeting is computed client-side only, same reasoning as before (spec
// §10: "time-of-day-aware greeting" — SSR has no reliable notion of the
// viewer's local time, so this fills in from an effect after mount rather
// than risking a hydration mismatch). The v2 header content order (level
// badge + streak, title, greeting, XP bar) is Part 5's explicit spec — the
// old date eyebrow isn't part of it, so it's been dropped.
export function Header() {
  const { totalXp, completionLog } = useStudentOSData();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    setGreeting(`Good ${timeOfDay}. Let's make today count.`);
  }, []);

  const progress = xpToLevel(totalXp);
  const streak = computeStreak(completionLog, todayISO());

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-top-row">
          <LevelBadge level={progress.level} />
          <div className="header-top-right">
            <StreakIndicator streak={streak} />
            <ThemeToggle />
            <Avatar />
          </div>
        </div>
        <h1 className="app-title">Student OS</h1>
        <p className="greeting">{greeting}</p>
        <XPBar progress={progress} />
      </div>
    </header>
  );
}
