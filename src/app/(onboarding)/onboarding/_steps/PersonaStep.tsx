'use client';

import { ChoiceGrid } from './StepShell';
import type { StepProps } from './types';

const options = [
  {
    value: 'saudi_buyer_abroad',
    title: 'Saudi buyer looking abroad',
    body: 'I am a Saudi buyer evaluating real estate in the UAE, Turkey, Greece, or Spain.',
  },
  {
    value: 'buyer_with_representative',
    title: 'Buyer with a representative',
    body: 'I have an adviser, family-office analyst, or lawyer working with me.',
  },
  {
    value: 'broker_invite_only',
    title: 'Broker partner — invite only',
    body: 'I represent buyers and was invited by the Mihad team. Continue with a normal account; the operator team will activate you.',
  },
];

export function PersonaStep({ data, setData }: StepProps) {
  return <ChoiceGrid options={options} value={data.persona} onChange={(persona) => setData({ persona })} />;
}
