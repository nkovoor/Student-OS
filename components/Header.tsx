'use client';

import { useEffect, useState } from 'react';

// Date/greeting are computed client-side only (spec §10: "time-of-day-aware
// greeting"). Filling these in from an effect rather than during the initial
// render avoids a hydration mismatch: the server has no reliable notion of
// the viewer's local date/time-of-day, so SSR renders empty placeholders and
// the real text appears the moment the client mounts.
export function Header() {
  const [dateText, setDateText] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const now = new Date();
    setDateText(
      now
        .toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        .toUpperCase()
    );
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    setGreeting(`Good ${timeOfDay}. Here's what's on your plate.`);
  }, []);

  return (
    <header className="app-header">
      <div className="header-inner">
        <p className="eyebrow">{dateText}</p>
        <h1 className="app-title">Student OS</h1>
        <p className="greeting">{greeting}</p>
      </div>
    </header>
  );
}
