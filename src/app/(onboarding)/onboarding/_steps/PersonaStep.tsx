'use client';

import { ChoiceGrid } from './StepShell';
import type { StepProps } from './types';

const options = [
  { value: 'self_serve_buyer', title: 'Self-serve buyer', body: 'I am buying for myself or my household.' },
  { value: 'broker', title: 'Broker or representative', body: 'I manage acquisition work for a buyer.' },
  { value: 'family_office', title: 'Family office', body: 'I source and screen opportunities for capital deployment.' },
  { value: 'analyst', title: 'Analyst or operator', body: 'I help prepare acquisition decisions.' },
];

export function PersonaStep({ data, setData }: StepProps) {
  return <ChoiceGrid options={options} value={data.persona} onChange={(persona) => setData({ persona })} />;
}
