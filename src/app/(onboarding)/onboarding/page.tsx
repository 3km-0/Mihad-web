'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PENDING_TRIAL_SETUP_STORAGE_KEY } from '@/components/payment/MoyasarTrialSetupForm';
import type { BuyBoxInput } from '@/lib/acquisition-workspace';
import { ACTIVATION_MANDATE_DRAFT_STORAGE_KEY, type ActivationMandateDraft } from '@/lib/activation-draft';
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
const TOKEN_PENDING_RETRY_DELAYS_MS = [0, 2500, 4000, 6000];

const initialData: OnboardingData = {
  language: 'en',
  persona: 'saudi_buyer_abroad',
  displayName: '',
  city: '',
  entityType: 'Individual',
  phone: '+966',
  phoneVerified: false,
  assetType: 'apartment',
  strategy: 'income_hold',
  budgetMin: '1500000',
  budgetMax: '5000000',
  budgetCurrency: 'SAR',
  financing: '',
  districts: '',
  timeline: '90_days',
  riskAppetite: 'balanced',
  renovationAppetite: 'light',
  mustHaves: '',
  avoid: '',
  workspaceName: '',
  trialActivated: false,
  targetCountries: ['AE'],
  purpose: 'investment',
  liquidityClass: 'cash_ready',
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapTimelineToMandateTimeline(value: string): string | null {
  switch (value) {
    case 'now':
    case '30_days':
      return 'immediate';
    case '90_days':
      return '1_to_3_months';
    case 'six_months':
      return '3_to_6_months';
    case '12_months':
    case '1_year':
      return '6_to_12_months';
    case 'watching':
    case 'open':
      return 'exploratory';
    default:
      return null;
  }
}

const steps = [
  {
    eyebrow: 'Buyer profile',
    title: 'Tell us who is buying.',
    subtitle: 'Set the account persona, buyer identity, and first market before the mandate is created.',
    backgroundImageSrc: '/onboarding/profile.jpg',
  },
  {
    eyebrow: 'Phone verification',
    title: 'Verify your phone number.',
    subtitle: 'This protects the acquisition workflow and prepares the account for WhatsApp-ready coordination.',
    backgroundImageSrc: '/onboarding/phone.jpg',
  },
  {
    eyebrow: 'Mandate focus',
    title: 'What should Mihad screen first?',
    subtitle: 'Choose the asset and strategy that define the first acquisition search. Districts are optional; empty means any suitable district in the selected city.',
    backgroundImageSrc: '/onboarding/mandate.jpg',
  },
  {
    eyebrow: 'Budget',
    title: 'Set the working budget.',
    subtitle: 'The browser search will use this to filter candidates before deeper screening.',
    backgroundImageSrc: '/onboarding/budget.jpg',
  },
  {
    eyebrow: 'Readiness',
    title: 'Define pace and risk.',
    subtitle: 'This helps separate urgent pursuits from watchlist candidates.',
    backgroundImageSrc: '/onboarding/readiness.jpg',
  },
  {
    eyebrow: 'Workspace',
    title: 'Add preferences and name the workspace.',
    subtitle: 'These become the workspace brief and the first pass/watch filters.',
    backgroundImageSrc: '/onboarding/workspace.jpg',
  },
  {
    eyebrow: 'Free trial',
    title: 'Start with one week free.',
    subtitle: 'No charge today. Your card is saved with Moyasar and only charged after the trial if you do not cancel.',
    backgroundImageSrc: '/onboarding/trial.jpg',
  },
  {
    eyebrow: 'Launch',
    title: 'We are preparing your acquisition desk.',
    subtitle: 'Mihad is creating the workspace and triggering the first browser-backed search run.',
    backgroundImageSrc: '/onboarding/launch.jpg',
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
  const [activationDraft, setActivationDraft] = useState<ActivationMandateDraft | null>(null);

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
      const activationRaw = window.localStorage.getItem(ACTIVATION_MANDATE_DRAFT_STORAGE_KEY);
      if (activationRaw) {
        try {
          const draft = JSON.parse(activationRaw) as ActivationMandateDraft;
          const payload = draft.payload;
          setActivationDraft(draft);
          setDataState((current) => ({
            ...current,
            displayName: payload.contact?.name || current.displayName,
            city: payload.city || current.city,
            districts: payload.district || current.districts,
            assetType: payload.project_type === 'land_activation' ? 'land' : 'mixed_use',
            strategy: 'income_hold',
            budgetMin: payload.budget_range?.min || current.budgetMin,
            budgetMax: payload.monthly_budget || payload.budget_range?.max || current.budgetMax,
            timeline: ['now', '30_days', '90_days', 'six_months'].includes(payload.timeline)
              ? payload.timeline as OnboardingData['timeline']
              : current.timeline,
            mustHaves: [payload.business_activity, payload.use_case, payload.style_reference].filter(Boolean).join('; ') || current.mustHaves,
            workspaceName: payload.city ? `Mihad activation - ${payload.city}` : current.workspaceName,
            phone: payload.contact?.phone || current.phone,
            targetCountries: ['SA'],
            purpose: 'investment',
          }));
        } catch {
          window.localStorage.removeItem(ACTIVATION_MANDATE_DRAFT_STORAGE_KEY);
        }
      }
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
      (async () => {
        for (let attempt = 0; attempt < TOKEN_PENDING_RETRY_DELAYS_MS.length; attempt += 1) {
          const delayMs = TOKEN_PENDING_RETRY_DELAYS_MS[attempt];
          if (delayMs > 0) {
            await sleep(delayMs);
          }

          const response = await fetch('/api/onboarding/trial/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token_id: pending.tokenId }),
          });
          const payload = await response.json();
          if (response.ok) {
            sessionStorage.removeItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
            setData({ trialActivated: true });
            setStep(6);
            return;
          }

          if (payload?.code === 'token_pending' && attempt < TOKEN_PENDING_RETRY_DELAYS_MS.length - 1) {
            continue;
          }

          throw new Error(payload?.error || 'Failed to start trial');
        }
      })().catch((error) => {
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
    notes: `Buyer entity: ${data.entityType}; onboarding language: ${data.language}`,
  }), [data]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(data.displayName.trim());
    if (step === 1) return data.phoneVerified;
    if (step === 2) return data.targetCountries.length > 0;
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
          target_country_codes: data.targetCountries,
          purpose: data.purpose || null,
          timeline: mapTimelineToMandateTimeline(data.timeline),
          liquidity_class: data.liquidityClass || null,
          budget_currency: data.budgetCurrency,
          budget_range: {
            min: data.budgetMin,
            max: data.budgetMax,
            currency: data.budgetCurrency,
          },
          preferences: {
            asset_type: data.assetType,
            risk_appetite: data.riskAppetite,
            renovation_appetite: data.renovationAppetite,
            must_haves: data.mustHaves,
            avoid: data.avoid,
            preferred_areas: data.districts,
            activation_request: activationDraft?.payload ?? null,
            activation_scoring: activationDraft?.scoring ?? null,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to complete onboarding');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
        sessionStorage.removeItem(PENDING_TRIAL_SETUP_STORAGE_KEY);
        window.localStorage.removeItem(ACTIVATION_MANDATE_DRAFT_STORAGE_KEY);
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

  const cancelOnboarding = () => {
    router.replace('/home');
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
      backgroundImageSrc={current.backgroundImageSrc}
      onCancel={step === 7 ? undefined : cancelOnboarding}
      onBack={goBack}
      onContinue={step === 7 ? undefined : goNext}
    >
      {content[step]}
    </StepShell>
  );
}
