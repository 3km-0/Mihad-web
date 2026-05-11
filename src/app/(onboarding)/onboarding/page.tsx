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

const ONBOARDING_DRAFT_STORAGE_KEY = 'zohal_onboarding_draft_v1';

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
    title: 'Tell us who is buying.',
    subtitle: 'Set the account persona, buyer identity, and first market before the mandate is created.',
  },
  {
    eyebrow: 'Phone verification',
    title: 'Verify your phone number.',
    subtitle: 'This protects the acquisition workflow and prepares the account for WhatsApp-ready coordination.',
  },
  {
    eyebrow: 'Mandate focus',
    title: 'What should Zohal screen first?',
    subtitle: 'Choose the asset, districts, and strategy that define the first acquisition search.',
  },
  {
    eyebrow: 'Budget',
    title: 'Set the working budget.',
    subtitle: 'The browser search will use this to filter candidates before deeper screening.',
  },
  {
    eyebrow: 'Readiness',
    title: 'Define pace and risk.',
    subtitle: 'This helps separate urgent pursuits from watchlist candidates.',
  },
  {
    eyebrow: 'Workspace',
    title: 'Add preferences and name the workspace.',
    subtitle: 'These become the workspace brief and the first pass/watch filters.',
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
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setData = useCallback((patch: Partial<OnboardingData>) => {
    setDataState((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const draft = JSON.parse(raw) as { data?: Partial<OnboardingData>; step?: number };
      if (draft.data) {
        setDataState((current) => ({ ...current, ...draft.data }));
      }
      if (typeof draft.step === 'number') {
        setStep(Math.max(0, Math.min(draft.step, steps.length - 2)));
      }
    } catch {
      sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return;
    sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify({ data, step }));
  }, [data, hydrated, step]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === 'undefined' || searchParams.get('trial_return') !== '1') return;
    const raw = sessionStorage.getItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
    if (!raw) {
      setStep(6);
      return;
    }

    try {
      const pending = JSON.parse(raw) as { tokenId?: string };
      setStep(6);
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
          setStep(6);
        })
        .catch((error) => {
          setStep(6);
          setSubmitError(error instanceof Error ? error.message : 'Failed to start trial');
        });
    } catch {
      sessionStorage.removeItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
      setStep(6);
    }
  }, [hydrated, searchParams, setData]);

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
    if (step === 0) return Boolean(data.displayName.trim() && data.city.trim());
    if (step === 1) return data.phoneVerified;
    if (step === 2) return Boolean(data.districts.trim());
    if (step === 3) return Boolean(data.budgetMax.trim());
    if (step === 5) return Boolean(data.workspaceName.trim());
    if (step === 6) return data.trialActivated;
    return true;
  }, [data, step]);

  const completeOnboarding = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setStep(7);
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
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
        sessionStorage.removeItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
      }
      router.replace(`/workspaces/${payload.workspace_id}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (step === 6) {
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
    <div key="profile" className="space-y-6">
      <PersonaStep {...stepProps} />
      <IdentityStep {...stepProps} />
    </div>,
    <PhoneStep key="phone" {...stepProps} />,
    <div key="mandate" className="space-y-6">
      <AssetTypeStep {...stepProps} />
      <MandateStep {...stepProps} />
    </div>,
    <BudgetStep key="budget" {...stepProps} />,
    <TimelineStep key="timeline" {...stepProps} />,
    <div key="workspace" className="space-y-6">
      <PreferencesStep {...stepProps} />
      <WorkspaceNameStep {...stepProps} />
    </div>,
    <TrialStep key="trial" {...stepProps} error={submitError} />,
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
      continueLabel={step === 6 ? 'Create workspace' : 'Continue'}
      loading={submitting}
      onBack={goBack}
      onContinue={step === 7 ? undefined : goNext}
    >
      {content[step]}
    </StepShell>
  );
}
