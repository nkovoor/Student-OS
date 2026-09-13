import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { TabNav } from '@/components/TabNav';
import { AnimatedMain } from '@/components/AnimatedMain';
import { StudentOSProvider } from '@/lib/state/StudentOSProvider';
import { ThemeProvider } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student OS',
};

// Runs before hydration so a returning dark-theme visitor doesn't see a
// flash of the light theme first — reads localStorage synchronously and
// sets the attribute the CSS keys off of (see app/globals.css's
// :root[data-theme='dark'] block) before the stylesheet paints anything.
// lib/theme.tsx's ThemeProvider then picks up the same stored value on
// mount so React's own state agrees with what's already on the page.
const THEME_INIT_SCRIPT = `
  try {
    var t = localStorage.getItem('student-os-theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <StudentOSProvider>
            <div id="app-shell">
              <Header />
              <TabNav />
              <AnimatedMain>{children}</AnimatedMain>
            </div>
          </StudentOSProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
