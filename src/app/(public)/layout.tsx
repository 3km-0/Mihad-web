'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const prefabChromeRoutes = [
    '/home',
    '/calculator',
    '/fieldbook',
    '/request-quote',
    '/models',
    '/suppliers',
    '/categories',
    '/guides',
    '/for-businesses',
    '/for-manufacturers',
    '/showcase',
    '/about',
  ];
  const ownsChrome = prefabChromeRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (ownsChrome) {
    return <>{children}</>;
  }

  return (
    <div
      className="website-shell relative min-h-screen bg-[color:var(--bg)] text-[color:var(--text)]"
    >
      <Header />
      <main className="relative z-10 min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
