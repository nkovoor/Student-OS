import { PLACEHOLDER_IDENTITY, initialsFor } from '@/lib/placeholderIdentity';

// Part B item 2. The 64px gradient avatar is a bigger, richer sibling of the
// header's 38px avatar chip — same blue->indigo direction, distinct glow.
export function IdentityBlock() {
  return (
    <div className="identity-block">
      <div className="identity-avatar">{initialsFor(PLACEHOLDER_IDENTITY.name)}</div>
      <div className="identity-text">
        <p className="identity-name">{PLACEHOLDER_IDENTITY.name}</p>
        <p className="identity-email">{PLACEHOLDER_IDENTITY.email}</p>
        <p className="identity-mock-flag">Mock profile data — real accounts coming soon</p>
      </div>
    </div>
  );
}
