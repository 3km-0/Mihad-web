import type { AssetType, RenovationAppetite, RiskOption, StrategyType, TimelineOption } from '@/lib/acquisition-workspace';

export type OnboardingData = {
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
  financing: string;
  districts: string;
  timeline: TimelineOption;
  riskAppetite: RiskOption;
  renovationAppetite: RenovationAppetite;
  mustHaves: string;
  avoid: string;
  workspaceName: string;
  trialActivated: boolean;
};

export type StepProps = {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
};
