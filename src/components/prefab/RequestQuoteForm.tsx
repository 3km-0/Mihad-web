'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { LAND_STATUS_OPTIONS, PREFAB_PROJECT_TYPES, PREFAB_WHATSAPP_URL, SCOPE_NEEDS } from '@/lib/prefab-content';
import { isArabic, prefabCopy, pickLocalized } from '@/lib/prefab-copy';

type RfqFormState = {
  projectType: string;
  city: string;
  landStatus: string;
  sizeSqm: string;
  rooms: string;
  useCase: string;
  styleReference: string;
  modelReference: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  scopeNeeds: string[];
  name: string;
  phone: string;
  email: string;
  whatsappPreferred: boolean;
  notes: string;
};

const initialState: RfqFormState = {
  projectType: '',
  city: '',
  landStatus: '',
  sizeSqm: '',
  rooms: '',
  useCase: '',
  styleReference: '',
  modelReference: '',
  budgetMin: '',
  budgetMax: '',
  timeline: '',
  scopeNeeds: [],
  name: '',
  phone: '',
  email: '',
  whatsappPreferred: true,
  notes: '',
};

export function RequestQuoteForm({
  initialProjectType,
  initialModel,
  initialSupplier,
}: {
  initialProjectType?: string;
  initialModel?: string;
  initialSupplier?: string;
}) {
  const locale = useLocale();
  const ar = isArabic(locale);
  const t = (copy: { ar: string; en: string }) => pickLocalized(locale, copy.ar, copy.en);
  const steps = prefabCopy.rfq.steps[ar ? 'ar' : 'en'];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RfqFormState>({
    ...initialState,
    projectType: initialProjectType || '',
    modelReference: initialModel || '',
    notes: initialSupplier ? `Interested supplier id: ${initialSupplier}` : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ rfq_id: string; whatsapp_url?: string } | null>(null);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(form.projectType);
    if (step === 1) return Boolean(form.city.trim() && form.landStatus);
    if (step === 2) return Boolean(form.useCase.trim() || form.sizeSqm.trim() || form.modelReference.trim());
    if (step === 3) return Boolean(form.budgetMax.trim() && form.timeline.trim());
    if (step === 5) return Boolean(form.name.trim() && form.phone.trim());
    return true;
  }, [form, step]);

  const patch = (update: Partial<RfqFormState>) => setForm((current) => ({ ...current, ...update }));
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
      const response = await fetch('/api/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_type: form.projectType,
          city: form.city,
          land_status: form.landStatus,
          size_sqm: form.sizeSqm,
          rooms: form.rooms,
          use_case: form.useCase,
          style_reference: form.styleReference,
          model_reference: form.modelReference,
          budget_range: { min: form.budgetMin, max: form.budgetMax, currency: 'SAR' },
          timeline: form.timeline,
          scope_needs: form.scopeNeeds,
          contact: {
            name: form.name,
            phone: form.phone,
            email: form.email,
            whatsapp_preferred: form.whatsappPreferred,
          },
          notes: form.notes,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || t(prefabCopy.rfq.fallbackError));
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
        <h2 className="mt-4 text-3xl font-semibold text-[#24352f]">{t(prefabCopy.rfq.successTitle)}</h2>
        <p className="mt-2 text-lg text-[#59645e]">
          {t(prefabCopy.rfq.successBody)}
        </p>
        <div className="mt-6 rounded-[8px] bg-[#f5f1e7] p-4 text-sm text-[#59645e]">
          {t(prefabCopy.rfq.reference)}: <span className="font-mono text-[#24352f]">{result.rfq_id}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={result.whatsapp_url || PREFAB_WHATSAPP_URL}
            className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white"
          >
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
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-[8px] px-2 py-2 text-xs font-semibold ${index === step ? 'bg-[#1f6b4f] text-white' : index < step ? 'bg-[#eef6ef] text-[#1f6b4f]' : 'bg-[#f5f1e7] text-[#6a746f]'}`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 md:p-6">
        {step === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {PREFAB_PROJECT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => patch({ projectType: type.value })}
                className={`rounded-[8px] border p-4 ${ar ? 'text-right' : 'text-left'} transition ${form.projectType === type.value ? 'border-[#1f6b4f] bg-[#eef6ef]' : 'border-[#e1dac9] bg-[#fbfaf6] hover:border-[#1f6b4f]'}`}
              >
                <span className="font-semibold text-[#24352f]">{ar ? type.labelAr : type.label}</span>
                <span className="mt-1 block text-sm text-[#6a746f]">{ar ? type.label : type.labelAr}</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4">
            <TextField label={t(prefabCopy.rfq.city)} value={form.city} onChange={(value) => patch({ city: value })} placeholder={t(prefabCopy.rfq.cityPlaceholder)} />
            <div>
              <p className="mb-2 text-sm font-semibold text-[#24352f]">{t(prefabCopy.rfq.ownLand)}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {LAND_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patch({ landStatus: option.value })}
                    className={`rounded-[8px] border p-4 ${ar ? 'text-right' : 'text-left'} ${form.landStatus === option.value ? 'border-[#1f6b4f] bg-[#eef6ef]' : 'border-[#e1dac9] bg-[#fbfaf6]'}`}
                  >
                    <span className="font-semibold">{ar ? option.labelAr : option.label}</span>
                    <span className="mt-1 block text-sm text-[#6a746f]">{ar ? option.label : option.labelAr}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t(prefabCopy.rfq.targetSize)} value={form.sizeSqm} onChange={(value) => patch({ sizeSqm: value })} placeholder={t(prefabCopy.rfq.targetSizePlaceholder)} />
            <TextField label={t(prefabCopy.rfq.rooms)} value={form.rooms} onChange={(value) => patch({ rooms: value })} placeholder={t(prefabCopy.rfq.roomsPlaceholder)} />
            <TextField label={t(prefabCopy.rfq.useCase)} value={form.useCase} onChange={(value) => patch({ useCase: value })} placeholder={t(prefabCopy.rfq.useCasePlaceholder)} />
            <TextField label={t(prefabCopy.rfq.style)} value={form.styleReference} onChange={(value) => patch({ styleReference: value })} placeholder={t(prefabCopy.rfq.stylePlaceholder)} />
            <div className="sm:col-span-2">
              <TextField label={t(prefabCopy.rfq.modelReference)} value={form.modelReference} onChange={(value) => patch({ modelReference: value })} placeholder={t(prefabCopy.rfq.modelReferencePlaceholder)} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t(prefabCopy.rfq.budgetMin)} value={form.budgetMin} onChange={(value) => patch({ budgetMin: value })} placeholder={t(prefabCopy.rfq.budgetMinPlaceholder)} />
            <TextField label={t(prefabCopy.rfq.budgetMax)} value={form.budgetMax} onChange={(value) => patch({ budgetMax: value })} placeholder={t(prefabCopy.rfq.budgetMaxPlaceholder)} />
            <div className="sm:col-span-2">
              <TextField label={t(prefabCopy.rfq.timeline)} value={form.timeline} onChange={(value) => patch({ timeline: value })} placeholder={t(prefabCopy.rfq.timelinePlaceholder)} />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <p className="mb-3 text-sm font-semibold text-[#24352f]">{t(prefabCopy.rfq.scopeHelp)}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SCOPE_NEEDS.map((scope) => (
                <button
                  key={scope.value}
                  type="button"
                  onClick={() => toggleScope(scope.value)}
                  className={`rounded-[8px] border p-4 ${ar ? 'text-right' : 'text-left'} ${form.scopeNeeds.includes(scope.value) ? 'border-[#1f6b4f] bg-[#eef6ef]' : 'border-[#e1dac9] bg-[#fbfaf6]'}`}
                >
                  <span className="font-semibold">{ar ? scope.labelAr : scope.label}</span>
                  <span className="mt-1 block text-sm text-[#6a746f]">{ar ? scope.label : scope.labelAr}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t(prefabCopy.rfq.name)} value={form.name} onChange={(value) => patch({ name: value })} placeholder={t(prefabCopy.rfq.namePlaceholder)} />
            <TextField label={t(prefabCopy.rfq.phone)} value={form.phone} onChange={(value) => patch({ phone: value })} placeholder="+966..." />
            <TextField label={t(prefabCopy.rfq.email)} value={form.email} onChange={(value) => patch({ email: value })} placeholder="name@example.com" />
            <label className="flex items-center gap-3 rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] p-4">
              <input type="checkbox" checked={form.whatsappPreferred} onChange={(event) => patch({ whatsappPreferred: event.target.checked })} />
              <span className="text-sm font-semibold text-[#24352f]">{t(prefabCopy.rfq.whatsappPreferred)}</span>
            </label>
            <div className="sm:col-span-2">
              <label className="grid gap-2 text-sm font-semibold text-[#24352f]">
                {t(prefabCopy.rfq.notes)}
                <textarea value={form.notes} onChange={(event) => patch({ notes: event.target.value })} className="min-h-28 rounded-[8px] border border-[#d8cfba] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f6b4f]" />
              </label>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#e1dac9] p-5">
        <button
          type="button"
          disabled={step === 0 || submitting}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-[#cfc5ad] px-4 text-sm font-semibold disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          {t(prefabCopy.rfq.back)}
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
            className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {t(prefabCopy.rfq.continue)}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue || submitting}
            onClick={submit}
            className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#1f6b4f] px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {submitting ? t(prefabCopy.rfq.sending) : t(prefabCopy.rfq.send)}
          </button>
        )}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#24352f]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 rounded-[8px] border border-[#d8cfba] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#1f6b4f] focus:ring-2 focus:ring-[#1f6b4f]/10"
      />
    </label>
  );
}
