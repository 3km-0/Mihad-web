'use client';

import { MoyasarTrialSetupForm } from '@/components/payment/MoyasarTrialSetupForm';
import type { StepProps } from './types';

export function TrialStep({ data, setData }: StepProps) {
  const callbackUrl =
    typeof window === 'undefined'
      ? '/onboarding'
      : `${window.location.origin}/onboarding?trial_return=1`;

  const activateTrial = async (tokenId: string) => {
    const response = await fetch('/api/onboarding/trial/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_id: tokenId }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error || 'Failed to start trial');
    setData({ trialActivated: true });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
        <p className="font-semibold text-text">7-day free trial. No charge today.</p>
        <p className="mt-2 text-sm leading-6 text-text-soft">
          Your card is saved securely with Moyasar. If you do not cancel before the trial ends, Zohal will charge SAR 199/month.
        </p>
      </div>
      {data.trialActivated ? (
        <div className="rounded-zohal border border-success/30 bg-success/10 p-3 text-sm text-success">
          Trial activated. You can create your workspace now.
        </div>
      ) : (
        <MoyasarTrialSetupForm tier="pro" period="monthly" callbackUrl={callbackUrl} onTokenReady={activateTrial} />
      )}
    </div>
  );
}
