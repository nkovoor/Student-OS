// Part 4: small pill/chip, trophy glyph + "LEVEL N".
export function LevelBadge({ level }: { level: number }) {
  return <span className="level-badge">🏆 LEVEL {level}</span>;
}
