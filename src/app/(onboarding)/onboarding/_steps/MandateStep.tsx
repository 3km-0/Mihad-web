'use client';

import { Input } from '@/components/ui';
import { ChoiceGrid } from './StepShell';
import type { StepProps } from './types';
import type { StrategyType } from '@/lib/acquisition-workspace';

const strategies = [
  { value: 'buy_renovate_rent', title: 'Renovate and rent', body: 'Find discounted assets with rental upside.' },
  { value: 'buy_renovate_sell', title: 'Renovate and sell', body: 'Focus on value-add resale potential.' },
  { value: 'income_hold', title: 'Income hold', body: 'Prioritize stable yield and lower operational drag.' },
  { value: 'family_office', title: 'Family office', body: 'Balance resilience, location, and long-term value.' },
  { value: 'opportunistic', title: 'Opportunistic', body: 'Let the agent screen wider for unusual mispricing.' },
];

export function MandateStep({ data, setData }: StepProps) {
  return (
    <div className="space-y-5">
      <Input
        label="Districts"
        placeholder="Hittin, Narjis, Malqa"
        value={data.districts}
        onChange={(event) => setData({ districts: event.target.value })}
        hint="Separate districts with commas."
      />
      <ChoiceGrid options={strategies} value={data.strategy} onChange={(strategy) => setData({ strategy: strategy as StrategyType })} />
    </div>
  );
}
