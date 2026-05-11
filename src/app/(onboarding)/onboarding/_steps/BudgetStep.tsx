'use client';

import { Input } from '@/components/ui';
import type { StepProps } from './types';

export function BudgetStep({ data, setData }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Minimum budget"
          placeholder="1500000"
          value={data.budgetMin}
          onChange={(event) => setData({ budgetMin: event.target.value.replace(/[^\d]/g, '') })}
          inputMode="numeric"
        />
        <Input
          label="Maximum budget"
          placeholder="5000000"
          value={data.budgetMax}
          onChange={(event) => setData({ budgetMax: event.target.value.replace(/[^\d]/g, '') })}
          inputMode="numeric"
        />
      </div>
      <Input
        label="Financing path"
        placeholder="Cash, mortgage pre-approval, mixed..."
        value={data.financing}
        onChange={(event) => setData({ financing: event.target.value })}
      />
      <p className="text-sm leading-6 text-text-soft">
        Zohal records readiness evidence and consent only. This is not underwriting or a credit decision.
      </p>
    </div>
  );
}
