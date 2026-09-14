// No auth exists yet (confirmed in the ground-truth status report — auth is
// "Not started"). This is the ONE place the Profile screen's mock identity
// lives, specifically so wiring in real auth later is a one-file change:
// swap this constant's source for whatever the real session/user object
// becomes, nothing that reads it needs to change.

export interface PlaceholderIdentity {
  name: string;
  email: string;
}

export const PLACEHOLDER_IDENTITY: PlaceholderIdentity = {
  name: 'Nithin R.',
  email: 'nithin@example.com',
};

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}
