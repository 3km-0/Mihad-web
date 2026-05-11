'use client';

import { ChoiceGrid } from './StepShell';
import type { StepProps } from './types';
import type { RenovationAppetite, RiskOption, TimelineOption } from '@/lib/acquisition-workspace';

const timelines = [
  { value: 'now', title: 'Now', body: 'Actively searching and ready to screen candidates.' },
  { value: '30_days', title: 'Within 30 days', body: 'Need a focused shortlist soon.' },
  { value: '90_days', title: 'Within 90 days', body: 'Build pipeline and compare patiently.' },
  { value: 'six_months', title: 'Six months', body: 'Watch market movement before committing.' },
];

const risk = [
  { value: 'conservative', title: 'Conservative', body: 'Prefer fit, evidence, and low surprises.' },
  { value: 'balanced', title: 'Balanced', body: 'Accept some uncertainty for better upside.' },
  { value: 'opportunistic', title: 'Opportunistic', body: 'Screen bold cases if the mispricing is clear.' },
];

const renovation = [
  { value: 'light', title: 'Light', body: 'Mostly cosmetic work.' },
  { value: 'medium', title: 'Medium', body: 'Some capex acceptable.' },
  { value: 'heavy', title: 'Heavy', body: 'Open to meaningful renovation.' },
  { value: 'avoid', title: 'Avoid', body: 'Prefer turnkey assets.' },
];

export function TimelineStep({ data, setData }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-text">Timeline</p>
        <ChoiceGrid options={timelines} value={data.timeline} onChange={(timeline) => setData({ timeline: timeline as TimelineOption })} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-text">Risk appetite</p>
        <ChoiceGrid options={risk} value={data.riskAppetite} onChange={(riskAppetite) => setData({ riskAppetite: riskAppetite as RiskOption })} />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-text">Renovation appetite</p>
        <ChoiceGrid
          options={renovation}
          value={data.renovationAppetite}
          onChange={(renovationAppetite) => setData({ renovationAppetite: renovationAppetite as RenovationAppetite })}
        />
      </div>
    </div>
  );
}
