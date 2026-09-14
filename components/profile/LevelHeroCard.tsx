import { levelToArchetype } from '@/lib/gamification';
import type { LevelProgress } from '@/lib/gamification';

// Part C: the one component on the Profile screen with a distinct, richer
// treatment — gradient/texture background, HUD corner brackets, a 10-segment
// XP bar (100 XP/segment, matching the existing flat 1000-XP-per-level
// rule). Everything else on this screen uses the plain .card style.
const SEGMENTS = 10;
const XP_PER_SEGMENT = 100;

export function LevelHeroCard({ progress }: { progress: LevelProgress }) {
  const archetype = levelToArchetype(progress.level);
  const filledCount = Math.min(SEGMENTS, Math.floor(progress.xpIntoLevel / XP_PER_SEGMENT));
  // The rightmost FILLED segment (not the next empty one) is "leading" — the
  // current progress edge that gets the pulsing glow, per Part C. Nothing
  // pulses at xpIntoLevel=0 (freshly leveled up, no segment filled yet).
  const leadingIndex = filledCount - 1;

  return (
    <div className="level-hero-card">
      <div className="level-hero-top-row">
        <div className="level-hero-level-group">
          <span className="level-hero-level-num">{progress.level}</span>
          <span className="level-hero-level-label">LEVEL</span>
        </div>
        <span className="level-hero-title-badge">🏆 {archetype}</span>
      </div>

      <div className="xp-seg-row">
        {Array.from({ length: SEGMENTS }, (_, index) => {
          const isFilled = index < filledCount;
          const isLeading = index === leadingIndex;
          return (
            <div key={index} className={'xp-seg' + (isFilled ? ' filled' : ' empty') + (isLeading ? ' leading' : '')} />
          );
        })}
      </div>
      <p className="xp-seg-note">10 chunks × 100 XP per level</p>

      <div className="level-hero-xp-row">
        <span className="level-hero-xp-current">{progress.xpIntoLevel} XP</span>
        <span className="level-hero-xp-next">
          {progress.xpToNextLevel} XP to Level {progress.level + 1}
        </span>
      </div>
    </div>
  );
}
