import type { LevelProgress } from '@/lib/gamification';

// Part 4: thin progress bar toward next level, mono label underneath.
export function XPBar({ progress }: { progress: LevelProgress }) {
  return (
    <div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${progress.progressFraction * 100}%` }} />
      </div>
      <div className="xp-bar-label">
        <span>{progress.xpIntoLevel} XP</span>
        <span>{progress.xpToNextLevel} XP to Level {progress.level + 1}</span>
      </div>
    </div>
  );
}
