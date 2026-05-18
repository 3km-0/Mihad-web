'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { PREFAB_WHATSAPP_URL } from '@/lib/prefab-content';
import { ACTIVATION_MANDATE_DRAFT_STORAGE_KEY, type ActivationMandateDraft } from '@/lib/activation-draft';
import { isArabic, prefabCopy } from '@/lib/prefab-copy';
import type { ActivationPartyType } from '@/lib/activation-scoring';
import {
  AudienceFields,
  ContactFields,
  EconomicsFields,
  LocationFields,
  PathFields,
  RightsChecklistFields,
  localized,
} from './activation-intake-fields';
import {
  audienceFromInitial,
  buildActivationRequestPayload,
  initialActivationIntakeState,
  projectTypeForAudience,
  validateActivationStep,
  type ActivationIntakeState,
} from './activation-intake-schema';

type RequestQuoteResult = {
  draft_id: string;
  next_url?: string;
  auth_required?: boolean;
  whatsapp_url?: string;
  route_recommendation?: string;
};

export function RequestQuoteForm({
  initialAudience,
  initialProjectType,
  initialModel,
  initialSupplier,
}: {
  initialAudience?: string;
  initialProjectType?: string;
  initialModel?: string;
  initialSupplier?: string;
}) {
  const locale = useLocale();
  const ar = isArabic(locale);
  const t = localized(locale);
  const steps = prefabCopy.rfq.steps[ar ? 'ar' : 'en'];
  const startingAudience = audienceFromInitial(initialAudience || initialProjectType);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ActivationIntakeState>({
    ...initialActivationIntakeState,
    audienceType: startingAudience,
    projectType: projectTypeForAudience(startingAudience, initialProjectType),
    model_reference: initialModel || '',
    notes: initialSupplier ? `Interested supplier id: ${initialSupplier}` : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RequestQuoteResult | null>(null);

  const canContinue = useMemo(() => validateActivationStep(form, step), [form, step]);
  const patch = (update: Partial<ActivationIntakeState>) => setForm((current) => ({ ...current, ...update }));
  const chooseAudience = (audienceType: ActivationPartyType) => {
    patch({
      audienceType,
      projectType: projectTypeForAudience(audienceType),
      land_status: audienceType === 'landowner' ? 'owned' : audienceType === 'supplier' ? 'unknown' : 'needed',
    });
  };
  const toggleScope = (value: string) => {
    setForm((current) => ({
      ...current,
      scopeNeeds: current.scopeNeeds.includes(value)
        ? current.scopeNeeds.filter((item) => item !== value)
        : [...current.scopeNeeds, value],
    }));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const draftPayload = buildActivationRequestPayload(form);
      const response = await fetch('/api/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftPayload),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || t(prefabCopy.rfq.fallbackError));
      const draft: ActivationMandateDraft = {
        draft_id: payload.draft_id || `draft_${Date.now()}`,
        payload: draftPayload,
        scoring: payload.activation_scoring,
        saved_at: new Date().toISOString(),
      };
      window.localStorage.setItem(ACTIVATION_MANDATE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(prefabCopy.rfq.fallbackError));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-[8px] border border-[#d8cfba] bg-white p-6 shadow-[0_18px_60px_rgba(36,53,47,0.12)] md:p-8">
        <CheckCircle2 className="h-10 w-10 text-[#1f6b4f]" />
        <h2 className="mt-4 text-3xl font-semibold text-[#24352f]">{ar ? 'حفظنا مسودة التفويض' : 'Mandate draft saved'}</h2>
        <p className="mt-2 text-lg text-[#59645e]">
          {ar
            ? 'الخطوة الجاية إنشاء حساب حتى نفتح مساحة الصفقة ونشغّل البحث عن الأراضي ونحفظ الخيارات والتقديرات.'
            : 'Create an account next so Mihad can open the deal workspace, run land sourcing, save options, and keep estimates.'}
        </p>
        <div className="mt-6 grid gap-3 rounded-[8px] bg-[#f5f1e7] p-4 text-sm text-[#59645e]">
          <p>{ar ? 'رقم المسودة' : 'Draft'}: <span className="font-mono text-[#24352f]">{result.draft_id}</span></p>
          {result.route_recommendation ? <p>{ar ? 'المسار المبدئي' : 'Initial route'}: <span className="font-semibold text-[#24352f]">{result.route_recommendation}</span></p> : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={result.next_url || '/auth/signup?redirect=/onboarding'} className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white">
            <CheckCircle2 className="h-4 w-4" />
            {ar ? 'أنشئ حساب وافتح مساحة الصفقة' : 'Create account and open workspace'}
          </Link>
          <Link href={result.whatsapp_url || PREFAB_WHATSAPP_URL} className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold text-[#24352f]">
            <MessageCircle className="h-4 w-4" />
            {t(prefabCopy.rfq.continueWhatsapp)}
          </Link>
          <Link href="/models" className="inline-flex min-h-11 items-center rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold text-[#24352f]">
            {t(prefabCopy.rfq.browseModels)}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-[#d8cfba] bg-white shadow-[0_18px_60px_rgba(36,53,47,0.12)]">
      <div className="border-b border-[#e1dac9] p-5">
        <p className="text-sm font-semibold text-[#1f6b4f]">{t(prefabCopy.rfq.headerEyebrow)}</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#24352f]">{t(prefabCopy.rfq.headerTitle)}</h1>
        <div className="mt-5 grid gap-2 sm:grid-cols-6">
          {steps.map((label, index) => (
            <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-[8px] px-2 py-2 text-xs font-semibold ${index === step ? 'bg-[#1f6b4f] text-white' : index < step ? 'bg-[#eef6ef] text-[#1f6b4f]' : 'bg-[#f5f1e7] text-[#6a746f]'}`}>
              {index + 1}. {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 md:p-6">
        {step === 0 ? <AudienceFields form={form} ar={ar} chooseAudience={chooseAudience} patch={patch} t={t} /> : null}
        {step === 1 ? <LocationFields form={form} ar={ar} patch={patch} t={t} /> : null}
        {step === 2 ? <PathFields form={form} ar={ar} patch={patch} t={t} /> : null}
        {step === 3 ? <EconomicsFields form={form} ar={ar} patch={patch} t={t} /> : null}
        {step === 4 ? <RightsChecklistFields form={form} ar={ar} patch={patch} t={t} toggleScope={toggleScope} /> : null}
        {step === 5 ? <ContactFields form={form} patch={patch} t={t} /> : null}
        {error ? <p className="mt-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#e1dac9] p-5">
        <button type="button" disabled={step === 0 || submitting} onClick={() => setStep((current) => Math.max(0, current - 1))} className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" />
          {t(prefabCopy.rfq.back)}
        </button>
        {step < steps.length - 1 ? (
          <button type="button" disabled={!canContinue} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white disabled:opacity-40">
            {t(prefabCopy.rfq.continue)}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" disabled={!canContinue || submitting} onClick={submit} className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white disabled:opacity-40">
            {submitting ? t(prefabCopy.rfq.sending) : t(prefabCopy.rfq.send)}
          </button>
        )}
      </div>
    </div>
  );
}
