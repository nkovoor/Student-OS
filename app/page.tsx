import { redirect } from 'next/navigation';

// Home isn't built yet (build order §4 puts it after Activities/Availability),
// so the root route lands on the first tab that exists.
export default function RootPage() {
  redirect('/activities');
}
