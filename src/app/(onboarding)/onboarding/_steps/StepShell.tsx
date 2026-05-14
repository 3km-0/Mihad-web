'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button, Card } from '@/components/ui';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StepShell({
  eyebrow,
  title,
  subtitle,
  step,
  totalSteps,
  canGoBack,
  canContinue = true,
  continueLabel = 'Continue',
  backLabel = 'Back',
  loading = false,
  backgroundImageSrc,
  onCancel,
  onBack,
  onContinue,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  canGoBack: boolean;
  canContinue?: boolean;
  continueLabel?: string;
  backLabel?: string;
  loading?: boolean;
  backgroundImageSrc?: string;
  onCancel?: () => void;
  onBack: () => void;
  onContinue?: () => void;
  children: React.ReactNode;
}) {
  const progress = Math.round(((step + 1) / totalSteps) * 100);
  const [imageAvailable, setImageAvailable] = useState(Boolean(backgroundImageSrc));

  useEffect(() => {
    setImageAvailable(Boolean(backgroundImageSrc));
  }, [backgroundImageSrc]);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-text">
      {backgroundImageSrc && imageAvailable ? (
        <div className="pointer-events-none fixed inset-0 opacity-45">
          <Image
            src={backgroundImageSrc}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover grayscale-[15%] saturate-[75%] brightness-[70%] contrast-[105%]"
            onError={() => setImageAvailable(false)}
          />
        </div>
      ) : null}
      {backgroundImageSrc && imageAvailable ? (
        <>
          <div className="pointer-events-none fixed inset-0 bg-background/45" />
          <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(12,12,12,0.58)_0%,rgba(12,12,12,0.34)_42%,rgba(12,12,12,0.58)_100%)]" />
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_45%,rgba(212,175,55,0.08),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(143,116,75,0.10),transparent_32%)]" />
        </>
      ) : null}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,243,74,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(255,199,89,0.12),transparent_28%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Zohal</p>
            <p className="mt-1 text-sm text-text-soft">Acquisition onboarding</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            {onCancel ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onCancel}
                disabled={loading}
                className="w-full border-accent/45 bg-accent/10 text-accent shadow-[0_0_24px_var(--accent-soft)] hover:border-accent hover:bg-accent/15 hover:text-accent sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Exit to home
              </Button>
            ) : null}
            <div className="w-full text-left sm:min-w-[180px] sm:text-right">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                Step {step + 1} of {totalSteps}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-text sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-text-soft sm:text-lg">{subtitle}</p>
          </div>

          <Card className="border-border/70 bg-surface/90 shadow-[var(--shadowMd)] backdrop-blur" padding="lg">
            <div className="space-y-6">{children}</div>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="secondary" onClick={onBack} disabled={!canGoBack || loading}>
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
              {onContinue ? (
                <Button type="button" onClick={onContinue} disabled={!canContinue || loading} isLoading={loading}>
                  {continueLabel}
                  <ArrowRight className={cn('h-4 w-4', loading && 'hidden')} />
                </Button>
              ) : null}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

export function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; title: string; body: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-2xl border p-4 text-left transition',
            value === option.value
              ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent)]'
              : 'border-border bg-surface-alt hover:border-accent/50'
          )}
        >
          <span className="block font-semibold text-text">{option.title}</span>
          <span className="mt-1 block text-sm leading-6 text-text-soft">{option.body}</span>
        </button>
      ))}
    </div>
  );
}
