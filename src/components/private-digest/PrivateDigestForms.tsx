'use client';

import { useState } from 'react';

type OfferResult = {
  reference?: string;
  status?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#101827]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-10 rounded-[6px] border border-[#D8DEE8] bg-white px-3 text-sm font-normal text-[#101827] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1D4E89] focus:ring-2 focus:ring-[#1D4E89]/15"
      />
    </label>
  );
}

export function SpaceOfferForm({ locale, spaceSlug }: { locale: string; spaceSlug: string }) {
  const ar = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OfferResult | null>(null);
  const [error, setError] = useState('');
  const patch = (update: Partial<typeof form>) => setForm((current) => ({ ...current, ...update }));

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/private-digest/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, spaceSlug }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Unable to send.');
      setResult(payload);
      setForm({ name: '', contact: '', message: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[#D8DEE8] pt-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-10 items-center rounded-[6px] border border-[#C8D2E0] bg-white px-4 text-sm font-semibold text-[#101827] transition hover:border-[#1D4E89] hover:text-[#1D4E89]"
      >
        {ar ? 'Make an offer' : 'Make an offer'}
      </button>

      {open ? (
        <div className="mt-4 rounded-[8px] border border-[#D8DEE8] bg-[#F8FAFC] p-4">
          {result?.reference ? (
            <div>
              <p className="text-sm font-semibold text-[#101827]">{ar ? 'وصلت الرسالة.' : 'Message received.'}</p>
              <p className="mt-2 text-sm leading-6 text-[#334155]">{result.message || (ar ? 'سيتعامل معها فريق مهاد يدويًا.' : 'The Mihad team will handle it manually.')}</p>
              <p className="mt-3 font-mono text-xs text-[#667085]">{result.reference}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={ar ? 'الاسم اختياري' : 'Name optional'} value={form.name} onChange={(name) => patch({ name })} />
                <Field label={ar ? 'وسيلة تواصل اختيارية' : 'Contact optional'} value={form.contact} onChange={(contact) => patch({ contact })} placeholder={ar ? 'جوال أو بريد' : 'Phone or email'} />
              </div>
              <label className="grid gap-2 text-sm font-semibold text-[#101827]">
                {ar ? 'الرسالة' : 'Message'}
                <textarea
                  value={form.message}
                  onChange={(event) => patch({ message: event.target.value })}
                  className="min-h-28 rounded-[6px] border border-[#D8DEE8] bg-white px-3 py-2 text-sm font-normal text-[#101827] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1D4E89] focus:ring-2 focus:ring-[#1D4E89]/15"
                  placeholder={ar ? 'اكتب رسالتك بهدوء وباختصار.' : 'Write a concise note.'}
                />
              </label>
              {error ? <p className="rounded-[6px] bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex min-h-10 items-center justify-center rounded-[6px] bg-[#23395D] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4E89] disabled:opacity-50"
              >
                {submitting ? (ar ? 'جاري الإرسال...' : 'Sending...') : (ar ? 'إرسال' : 'Send')}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
