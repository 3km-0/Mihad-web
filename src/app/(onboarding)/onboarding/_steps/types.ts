import type { AssetType, RenovationAppetite, RiskOption, StrategyType, TimelineOption } from '@/lib/acquisition-workspace';

export type MihadCountryCode = 'AE' | 'TR' | 'GR' | 'ES' | 'SA';

export type MandatePurpose =
  | 'investment'
  | 'family_use'
  | 'residency'
  | 'education'
  | 'relocation'
  | 'wealth_preservation';

export type LiquidityClass = 'cash_ready' | 'financing_ready' | 'mixed' | 'needs_financing_guidance';

export type OnboardingData = {
  language: 'en' | 'ar';
  persona: string;
  displayName: string;
  city: string;
  entityType: string;
  phone: string;
  phoneVerified: boolean;
  assetType: AssetType;
  strategy: StrategyType;
  budgetMin: string;
  budgetMax: string;
  budgetCurrency: 'SAR' | 'AED' | 'TRY' | 'EUR' | 'USD' | 'GBP';
  financing: string;
  districts: string;
  timeline: TimelineOption;
  riskAppetite: RiskOption;
  renovationAppetite: RenovationAppetite;
  mustHaves: string;
  avoid: string;
  workspaceName: string;
  trialActivated: boolean;
  targetCountries: MihadCountryCode[];
  purpose: MandatePurpose | '';
  liquidityClass: LiquidityClass | '';
};

export type StepProps = {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
};
