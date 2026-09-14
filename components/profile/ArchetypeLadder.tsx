import { ARCHETYPE_TIERS } from '@/lib/gamification';

function tierRangeLabel(minLevel: number, maxLevel: number | null): string {
  return maxLevel === null ? `Lv ${minLevel}+` : `Lv ${minLevel}–${maxLevel}`;
}

// Part B item 4 / Part D. Tiers below the student's current level = passed,
// the tier their level falls in = current, everything above = locked.
export function ArchetypeLadder({ level }: { level: number }) {
  const currentTierIndex = ARCHETYPE_TIERS.findIndex(
    (tier) => level >= tier.minLevel && (tier.maxLevel === null || level <= tier.maxLevel)
  );

  return (
    <div className="card card-accent-top">
      <h3 className="card-title">Archetype Ladder</h3>
      {ARCHETYPE_TIERS.map((tier, index) => {
        const status = index < currentTierIndex ? 'passed' : index === currentTierIndex ? 'current' : 'locked';
        return (
          <div className={`ladder-row is-${status}`} key={tier.title}>
            <span className="ladder-tier">{tierRangeLabel(tier.minLevel, tier.maxLevel)}</span>
            <span className="ladder-title">{tier.title}</span>
            <span className="ladder-status">
              {status === 'passed' ? '✓ Passed' : status === 'current' ? '● Current' : '🔒 Locked'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
