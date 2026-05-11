'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PENDING_TRIAL_SETUP_STORAGE_KEY } from '@/components/payment/MoyasarTrialSetupForm';
import type { BuyBoxInput } from '@/lib/acquisition-workspace';
import { StepShell } from './_steps/StepShell';
import { PersonaStep } from './_steps/PersonaStep';
import { IdentityStep } from './_steps/IdentityStep';
import { PhoneStep } from './_steps/PhoneStep';
import { AssetTypeStep } from './_steps/AssetTypeStep';
import { BudgetStep } from './_steps/BudgetStep';
import { MandateStep } from './_steps/MandateStep';
import { TimelineStep } from './_steps/TimelineStep';
import { PreferencesStep } from './_steps/PreferencesStep';
import { WorkspaceNameStep } from './_steps/WorkspaceNameStep';
import { TrialStep } from './_steps/TrialStep';
import { CreatingStep } from './_steps/CreatingStep';
import type { OnboardingData } from './_steps/types';

const initialData: OnboardingData = {
  persona: 'self_serve_buyer',
  displayName: '',
  city: 'Riyadh',
  entityType: 'Individual',
  phone: '+966',
  phoneVerified: false,
  assetType: 'villa',
  strategy: 'buy_renovate_rent',
  budgetMin: '',
  budgetMax: '',
  financing: '',
  districts: '',
  timeline: '90_days',
  riskAppetite: 'balanced',
  renovationAppetite: 'medium',
  mustHaves: '',
  avoid: '',
  workspaceName: '',
  trialActivated: false,
};

const steps = [
  {
    eyebrow: 'Buyer profile',
    title: 'Who are you here as?',
    subtitle: 'This helps Zohal shape the first acquisition workspace around the way you make decisions.',
  },
  {
    eyebrow: 'Identity',
    title: 'Tell us who is buying.',
    subtitle: 'Keep account identity, buyer identity, and the mandate separate from day one.',
  },
  {
    eyebrow: 'Phone verification',
    title: 'Verify your phone number.',
    subtitle: 'This protects the acquisition workflow and prepares the account for WhatsApp-ready coordination.',
  },
  {
    eyebrow: 'Asset focus',
    title: 'What kind of asset should Zohal screen first?',
    subtitle: 'Choose the acquisition target that best matches your first mandate.',
  },
  {
    eyebrow: 'Budget',
    title: 'Set the working budget.',
    subtitle: 'The browser search will use this to filter candidates before deeper screening.',
  },
  {
    eyebrow: 'Mandate',
    title: 'Where should the search focus?',
    subtitle: 'Districts and strategy turn a broad market into a usable acquisition mandate.',
  },
  {
    eyebrow: 'Readiness',
    title: 'Define pace and risk.',
    subtitle: 'This helps separate urgent pursuits from watchlist candidates.',
  },
  {
    eyebrow: 'Preferences',
    title: 'Add must-haves and exclusions.',
    subtitle: 'These keep the search focused and make pass/watch decisions more explainable.',
  },
  {
    eyebrow: 'Workspace',
    title: 'Name your acquisition workspace.',
    subtitle: 'This workspace will hold the mandate, candidates, evidence, notes, and decisions.',
  },
  {
    eyebrow: 'Free trial',
    title: 'Start with one week free.',
    subtitle: 'No charge today. Your card is saved with Moyasar and only charged after the trial if you do not cancel.',
  },
  {
    eyebrow: 'Launch',
    title: 'We are preparing your acquisition desk.',
    subtitle: 'Zohal is creating the workspace and triggering the first browser-backed search run.',
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [data, setDataState] = useState<OnboardingData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setData = useCallback((patch: Partial<OnboardingData>) => {
    setDataState((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || searchParams.get('trial_return') !== '1') return;
    const raw = sessionStorage.getItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
    if (!raw) return;

    try {
      const pending = JSON.parse(raw) as { tokenId?: string };
      if (!pending.tokenId) return;
      fetch('/api/onboarding/trial/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: pending.tokenId }),
      })
        .then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload?.error || 'Failed to start trial');
          sessionStorage.removeItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
          setData({ trialActivated: true });
        })
        .catch((error) => setSubmitError(error instanceof Error ? error.message : 'Failed to start trial'));
    } catch {
      sessionStorage.removeItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
    }
  }, [searchParams, setData]);

  const buyBox = useMemo<BuyBoxInput>(() => ({
    city: data.city,
    districts: data.districts,
    asset_type: data.assetType,
    strategy: data.strategy,
    budget_min_sar: data.budgetMin,
    budget_max_sar: data.budgetMax,
    financing: data.financing,
    timeline: data.timeline,
    risk_appetite: data.riskAppetite,
    renovation_appetite: data.renovationAppetite,
    must_haves: data.mustHaves,
    avoid: data.avoid,
    notes: `Buyer entity: ${data.entityType}`,
  }), [data]);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(data.displayName.trim() && data.city.trim());
    if (step === 2) return data.phoneVerified;
    if (step === 4) return Boolean(data.budgetMax.trim());
    if (step === 5) return Boolean(data.districts.trim());
    if (step === 8) return Boolean(data.workspaceName.trim());
    if (step === 9) return data.trialActivated;
    return true;
  }, [data, step]);

  const completeOnboarding = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setStep(10);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: data.persona,
          display_name: data.displayName,
          workspace_name: data.workspaceName,
          buy_box: buyBox,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to complete onboarding');
      router.replace(`/workspaces/${payload.workspace_id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === 9) {
      completeOnboarding();
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setSubmitError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  const stepProps = { data, setData };
  const content = [
    <PersonaStep key="persona" {...stepProps} />,
    <IdentityStep key="identity" {...stepProps} />,
    <PhoneStep key="phone" {...stepProps} />,
    <AssetTypeStep key="asset" {...stepProps} />,
    <BudgetStep key="budget" {...stepProps} />,
    <MandateStep key="mandate" {...stepProps} />,
    <TimelineStep key="timeline" {...stepProps} />,
    <PreferencesStep key="preferences" {...stepProps} />,
    <WorkspaceNameStep key="workspace" {...stepProps} />,
    <TrialStep key="trial" {...stepProps} />,
    <CreatingStep key="creating" error={submitError} />,
  ];

  const current = steps[step];

  return (
    <StepShell
      eyebrow={current.eyebrow}
      title={current.title}
      subtitle={current.subtitle}
      step={step}
      totalSteps={steps.length}
      canGoBack={step > 0 && !submitting}
      canContinue={canContinue}
      continueLabel={step === 9 ? 'Create workspace' : 'Continue'}
      loading={submitting}
      onBack={goBack}
      onContinue={step === 10 ? undefined : goNext}
    >
      {content[step]}
    </StepShell>
  );
}
