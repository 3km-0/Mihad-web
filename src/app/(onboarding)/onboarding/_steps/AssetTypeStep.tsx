'use client';

import { ChoiceGrid } from './StepShell';
import type { StepProps } from './types';
import type { AssetType } from '@/lib/acquisition-workspace';

const options = [
  { value: 'villa', title: 'Villa', body: 'Family-sized assets and value-add villa opportunities.' },
  { value: 'townhouse', title: 'Townhouse', body: 'Modern compounds and lower-maintenance family homes.' },
  { value: 'apartment', title: 'Apartment', body: 'Income-oriented units and compact holdings.' },
  { value: 'building', title: 'Building', body: 'Whole-building acquisition and income hold cases.' },
  { value: 'land', title: 'Land', body: 'Plots where the value is in location and future potential.' },
  { value: 'mixed_use', title: 'Mixed use', body: 'Commercially flexible assets that need closer screening.' },
];

export function AssetTypeStep({ data, setData }: StepProps) {
  return <ChoiceGrid options={options} value={data.assetType} onChange={(assetType) => setData({ assetType: assetType as AssetType })} />;
}
