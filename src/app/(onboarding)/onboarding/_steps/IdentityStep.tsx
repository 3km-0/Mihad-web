'use client';

import { Input, ZohalSelect } from '@/components/ui';
import { onboardingLanguages, saudiCities } from './options';
import type { StepProps } from './types';

export function IdentityStep({ data, setData }: StepProps) {
  const cityOptions = saudiCities.map((city) => ({
    value: city.value,
    label: data.language === 'ar' ? `${city.ar} (${city.en})` : `${city.en} (${city.ar})`,
  }));

  return (
    <div className="space-y-4">
      <ZohalSelect
        label="Onboarding language"
        value={data.language}
        onChange={(event) => setData({ language: event.target.value as 'en' | 'ar' })}
        options={[...onboardingLanguages]}
        helperText="This controls language-sensitive onboarding choices. Full product localization follows account settings."
      />
      <Input
        label="Full name"
        placeholder="Abdullah Al..."
        value={data.displayName}
        onChange={(event) => setData({ displayName: event.target.value })}
        autoComplete="name"
      />
      <ZohalSelect
        label="Primary city"
        value={data.city}
        onChange={(event) => setData({ city: event.target.value })}
        options={cityOptions}
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
