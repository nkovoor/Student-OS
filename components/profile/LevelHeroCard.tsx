import { levelToArchetype } from '@/lib/gamification';
import type { LevelProgress } from '@/lib/gamification';

// Part C: the one component on the Profile screen with a distinct, richer
// treatment — a gradient background, still calmer than the rest of the app.
// Re-skinned to drop the old segmented-glow/pulsing/corner-bracket HUD
// styling in favor of the single exact-color-matched progress bar Kit 04
// uses everywhere else in the app. Everything else on this screen uses the
// plain .card style.
export function LevelHeroCard({ progress }: { progress: LevelProgress }) {
  const archetype = levelToArchetype(progress.level);

  return (
    <div className="level-hero-card">
      <div className="level-hero-top-row">
        <div className="level-hero-level-group">
          <span className="level-hero-level-num">{progress.level}</span>
          <span className="level-hero-level-label">LEVEL</span>
        </div>
        <span className="level-hero-title-badge">🏆 {archetype}</span>
      </div>

      <div className="level-hero-progress-track">
        <div className="level-hero-progress-fill" style={{ width: `${progress.progressFraction * 100}%` }} />
      </div>

      <div className="level-hero-xp-row">
        <span className="level-hero-xp-current">{progress.xpIntoLevel} XP</span>
        <span className="level-hero-xp-next">
          {progress.xpToNextLevel} XP to Level {progress.level + 1}
        </span>
      </div>
    </div>
  );
}
