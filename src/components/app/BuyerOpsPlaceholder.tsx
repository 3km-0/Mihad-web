import { AppHeader } from '@/components/layout/AppHeader';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function BuyerOpsPlaceholder({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AppHeader title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-auto p-6">
        <section className="rounded-[8px] border border-border bg-surface p-6 shadow-[var(--shadowSm)]">
          <div className="max-w-3xl space-y-4 text-sm leading-6 text-text-soft">
            {children}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/workspaces"
                className="inline-flex min-h-10 items-center rounded-[8px] bg-accent px-4 text-sm font-semibold text-accent-foreground"
              >
                Open RFQ dashboard
              </Link>
              <Link
                href="/request-quote"
                className="inline-flex min-h-10 items-center rounded-[8px] border border-border px-4 text-sm font-semibold text-text"
              >
                Submit public RFQ
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
