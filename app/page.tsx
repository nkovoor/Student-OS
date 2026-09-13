import { redirect } from 'next/navigation';

// Home is the hero screen (spec §2), so the root route lands there.
export default function RootPage() {
  redirect('/home');
}
