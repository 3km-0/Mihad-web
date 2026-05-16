'use client';

import { Input } from '@/components/ui';
import { ChoiceGrid } from './StepShell';
import type { LiquidityClass, MandatePurpose, MihadCountryCode, StepProps } from './types';

const COUNTRIES: Array<{ value: MihadCountryCode; title: string; body: string }> = [
  { value: 'SA', title: 'Saudi Arabia', body: 'Riyadh, Jeddah, and other domestic search mandates.' },
  { value: 'AE', title: 'United Arab Emirates', body: 'Dubai, Abu Dhabi, and surrounding emirates.' },
  { value: 'TR', title: 'Türkiye', body: 'Istanbul, Antalya, Bodrum, Izmir.' },
];

const PURPOSES: Array<{ value: MandatePurpose; title: string; body: string }> = [
  { value: 'investment', title: 'Investment', body: 'Buy for yield, appreciation, or capital preservation.' },
  { value: 'family_use', title: 'Family use', body: 'A second home for travel or extended stays.' },
  { value: 'residency', title: 'Residency', body: 'Qualify for residency or visa programs through property.' },
  { value: 'education', title: 'Education', body: 'A base near a university or school for a family member.' },
  { value: 'relocation', title: 'Relocation', body: 'Move primary residence abroad.' },
  { value: 'wealth_preservation', title: 'Wealth preservation', body: 'Diversify out of one currency or jurisdiction.' },
];

const LIQUIDITY: Array<{ value: LiquidityClass; title: string; body: string }> = [
  { value: 'cash_ready', title: 'Cash-ready', body: 'Funds are liquid in SAR or in a foreign account already.' },
  { value: 'financing_ready', title: 'Financing-ready', body: 'Pre-approved or have a bank relationship in place.' },
  { value: 'mixed', title: 'Mixed', body: 'Part cash, part financing — open to either route.' },
  { value: 'needs_financing_guidance', title: 'Need guidance', body: 'Help me figure out the right financing path.' },
];

export function MandateStep({ data, setData }: StepProps) {
  const toggleCountry = (code: MihadCountryCode) => {
    const next = new Set(data.targetCountries);
    if (next.has(code)) next.delete(code); else next.add(code);
    if (next.size === 0) next.add(code);
    setData({ targetCountries: Array.from(next) });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-soft">Target market</h3>
          <p className="text-sm text-text-soft">Pick one or more launch markets. Saudi Arabia, the UAE, and Türkiye are the public Mihad flow; older markets remain available only for existing workspaces.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {COUNTRIES.map((country) => {
            const active = data.targetCountries.includes(country.value);
            return (
              <button
                key={country.value}
                type="button"
                onClick={() => toggleCountry(country.value)}
                className={
                  'rounded-2xl border p-4 text-left transition ' +
                  (active
                    ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent)]'
                    : 'border-border bg-surface-alt hover:border-accent/50')
                }
              >
                <span className="block font-semibold text-text">{country.title}</span>
                <span className="mt-1 block text-sm leading-6 text-text-soft">{country.body}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-soft">Purpose</h3>
          <p className="text-sm text-text-soft">Why are you considering buying abroad? You can refine this later.</p>
        </div>
        <ChoiceGrid
          options={PURPOSES}
          value={data.purpose}
          onChange={(purpose) => setData({ purpose: purpose as MandatePurpose })}
        />
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-soft">Financing posture</h3>
          <p className="text-sm text-text-soft">Mihad uses this to route the right legal and FX partners.</p>
        </div>
        <ChoiceGrid
          options={LIQUIDITY}
          value={data.liquidityClass}
          onChange={(liquidityClass) => setData({ liquidityClass: liquidityClass as LiquidityClass })}
        />
      </section>

      <Input
        label="Preferred areas (optional)"
        placeholder="Dubai Marina, Bodrum, Athens Riviera, Marbella"
        value={data.districts}
        onChange={(event) => setData({ districts: event.target.value })}
        hint="Leave empty to let Mihad propose a shortlist across the selected markets."
      />
    </div>
  );
}
