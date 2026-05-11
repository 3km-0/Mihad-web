'use client';

import { Button, Card } from '@/components/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
  onBack: () => void;
  onContinue?: () => void;
  children: React.ReactNode;
}) {
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-text">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,243,74,0.18),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(255,199,89,0.12),transparent_28%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Zohal</p>
            <p className="mt-1 text-sm text-text-soft">Acquisition onboarding</p>
          </div>
          <div className="min-w-[160px] text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
              Step {step + 1} of {totalSteps}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
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
