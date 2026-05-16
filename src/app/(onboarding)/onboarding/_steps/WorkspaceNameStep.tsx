'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui';
import type { StepProps } from './types';

export function WorkspaceNameStep({ data, setData }: StepProps) {
  useEffect(() => {
    if (!data.workspaceName.trim()) {
      const city = data.city.trim() || 'Riyadh';
      setData({ workspaceName: `${city} ${data.assetType.replace(/_/g, ' ')} mandate` });
    }
  }, [data.assetType, data.city, data.workspaceName, setData]);

  return (
    <div className="space-y-4">
      <Input
        label="Workspace name"
        placeholder="Riyadh villa mandate"
        value={data.workspaceName}
        onChange={(event) => setData({ workspaceName: event.target.value })}
      />
      <div className="rounded-zohal border border-border bg-surface-alt p-4 text-sm leading-6 text-text-soft">
        This becomes your first acquisition workspace. Mihad will use the mandate to fetch and screen initial candidates.
      </div>
    </div>
  );
}
