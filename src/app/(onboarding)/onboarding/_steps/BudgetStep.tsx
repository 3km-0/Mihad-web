'use client';

import { ZohalSelect } from '@/components/ui';
import { cn } from '@/lib/utils';
import { financingOptions } from './options';
import type { StepProps } from './types';

const MIN_BUDGET = 500_000;
const MAX_BUDGET = 20_000_000;
const STEP = 250_000;
const MIN_GAP = 500_000;

function parseBudget(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatSar(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M SAR`;
  }
  return `${Math.round(value / 1000).toLocaleString('en-US')}K SAR`;
}

export function BudgetStep({ data, setData }: StepProps) {
  const min = parseBudget(data.budgetMin, 1_500_000);
  const max = parseBudget(data.budgetMax, 5_000_000);
  const minPercent = ((min - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;
  const maxPercent = ((max - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;

  const updateMin = (value: number) => {
    const nextMin = Math.min(value, max - MIN_GAP);
    setData({ budgetMin: String(Math.max(MIN_BUDGET, nextMin)) });
  };

  const updateMax = (value: number) => {
    const nextMax = Math.max(value, min + MIN_GAP);
    setData({ budgetMax: String(Math.min(MAX_BUDGET, nextMax)) });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface-alt p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text">Budget range</p>
            <p className="mt-1 text-sm text-text-soft">Drag both handles instead of typing numbers.</p>
          </div>
          <div className="text-right font-mono text-sm font-semibold text-text">
            {formatSar(min)} - {formatSar(max)}
          </div>
        </div>

        <div className="relative mt-8 h-10">
          <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
            style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
          />
          {[{ value: min, onChange: updateMin, label: 'Minimum budget' }, { value: max, onChange: updateMax, label: 'Maximum budget' }].map((range) => (
            <input
              key={range.label}
              aria-label={range.label}
              type="range"
              min={MIN_BUDGET}
              max={MAX_BUDGET}
              step={STEP}
              value={range.value}
              onChange={(event) => range.onChange(Number(event.target.value))}
              className={cn(
                'pointer-events-none absolute left-0 top-1/2 h-10 w-full -translate-y-1/2 appearance-none bg-transparent',
                '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
                '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2',
                '[&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md',
                '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5',
                '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background',
                '[&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:shadow-md'
              )}
            />
          ))}
        </div>

        <div className="mt-2 flex justify-between text-xs text-text-muted">
          <span>{formatSar(MIN_BUDGET)}</span>
          <span>{formatSar(MAX_BUDGET)}</span>
        </div>
      </div>

      <ZohalSelect
        label="Financing path"
        value={data.financing}
        onChange={(event) => setData({ financing: event.target.value })}
        options={[...financingOptions]}
        helperText="You can change this later as readiness evidence improves."
      />
      <p className="text-sm leading-6 text-text-soft">
        Mihad records readiness evidence and consent only. This is not underwriting or a credit decision.
      </p>
    </div>
  );
}
