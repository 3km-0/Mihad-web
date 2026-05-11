'use client';

import { Spinner } from '@/components/ui';

export function CreatingStep({ error }: { error?: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {error ? (
        <div className="rounded-zohal border border-error/30 bg-error/10 p-4 text-sm text-error">{error}</div>
      ) : (
        <>
          <Spinner size="lg" />
          <h2 className="mt-5 text-xl font-semibold text-text">Creating your acquisition workspace</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-soft">
            We are saving your mandate and starting the first acquisition search run.
          </p>
        </>
      )}
    </div>
  );
}
