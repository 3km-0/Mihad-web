'use client';

import { Input } from '@/components/ui';
import type { StepProps } from './types';

export function IdentityStep({ data, setData }: StepProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Full name"
        placeholder="Abdullah Al..."
        value={data.displayName}
        onChange={(event) => setData({ displayName: event.target.value })}
        autoComplete="name"
      />
      <Input
        label="Primary city"
        placeholder="Riyadh"
        value={data.city}
        onChange={(event) => setData({ city: event.target.value })}
      />
      <Input
        label="Buyer entity"
        placeholder="Individual, company, family office..."
        value={data.entityType}
        onChange={(event) => setData({ entityType: event.target.value })}
      />
    </div>
  );
}
