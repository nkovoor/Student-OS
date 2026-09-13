import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { TabNav } from '@/components/TabNav';
import { AnimatedMain } from '@/components/AnimatedMain';
import { StudentOSProvider } from '@/lib/state/StudentOSProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student OS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <StudentOSProvider>
          <div id="app-shell">
            <Header />
            <TabNav />
            <AnimatedMain>{children}</AnimatedMain>
          </div>
        </StudentOSProvider>
      </body>
    </html>
  );
}
