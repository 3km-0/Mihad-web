'use client';

import { Input } from '@/components/ui';
import type { StepProps } from './types';

export function PreferencesStep({ data, setData }: StepProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Must-haves"
        placeholder="North Riyadh, good street width, room for renovation"
        value={data.mustHaves}
        onChange={(event) => setData({ mustHaves: event.target.value })}
        hint="Separate must-haves with commas."
      />
      <Input
        label="Avoid"
        placeholder="Flood risk, very old structure, unclear title"
        value={data.avoid}
        onChange={(event) => setData({ avoid: event.target.value })}
        hint="Separate exclusions with commas."
      />
    </div>
  );
}
