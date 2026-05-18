'use client';

import { useState } from 'react';
import Link from 'next/link';

type ApiResult = {
  reference?: string;
  whatsapp_url?: string;
  error?: string;
  errors?: Record<string, string>;
};

function Field({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#1e1a14]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="min-h-11 rounded-[8px] border border-[#d7cbb8] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#8c6f45] focus:ring-2 focus:ring-[#8c6f45]/15"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#1e1a14] sm:col-span-2">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 rounded-[8px] border border-[#d7cbb8] bg-white px-3 py-2 text-sm font-normal outline-none transition focus:border-[#8c6f45] focus:ring-2 focus:ring-[#8c6f45]/15"
      />
    </label>
  );
}

function Consent({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex gap-3 rounded-[8px] border border-[#d7cbb8] bg-[#fbf8f2] p-4 text-sm font-semibold leading-6 text-[#4f4638]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
      <span>{label}</span>
    </label>
  );
}

function SuccessPanel({ result, title, body }: { result: ApiResult; title: string; body: string }) {
  return (
    <div className="rounded-[8px] border border-[#d7cbb8] bg-white p-6 shadow-[0_24px_70px_rgba(30,26,20,0.1)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c6f45]">Mihad</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-[#1e1a14]">{title}</h2>
      <p className="mt-3 leading-7 text-[#625746]">{body}</p>
      <p className="mt-5 rounded-[8px] bg-[#f7f2e8] p-3 font-mono text-sm text-[#1e1a14]">{result.reference}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {result.whatsapp_url ? (
          <Link href={result.whatsapp_url} className="inline-flex min-h-11 items-center rounded-[8px] bg-[#1e1a14] px-4 text-sm font-semibold text-white">
            Continue on WhatsApp
          </Link>
        ) : null}
        <Link href="/home" className="inline-flex min-h-11 items-center rounded-[8px] border border-[#c9bda8] px-4 text-sm font-semibold text-[#1e1a14]">
          Back to Mihad
        </Link>
      </div>
    </div>
  );
}

export function OwnerSubmissionForm({ locale }: { locale: string }) {
  const ar = locale === 'ar';
  const [form, setForm] = useState({
    name: '',
    phone: '',
    role: '',
    city: '',
    propertyType: '',
    privacyPreference: '',
    originalMediaReady: false,
    consent: false,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState('');
  const patch = (update: Partial<typeof form>) => setForm((current) => ({ ...current, ...update }));

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/private-digest/owner-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Unable to submit.');
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <SuccessPanel
        result={result}
        title={ar ? 'وصلنا طلبك الخاص.' : 'Your private submission was received.'}
        body={ar ? 'مهاد سيراجع الملاءمة والخصوصية قبل أي ظهور عام أو مشاركة مع مشترين.' : 'Mihad will review fit and privacy before any public presentation or buyer sharing.'}
      />
    );
  }

  return (
    <div className="rounded-[8px] border border-[#d7cbb8] bg-white p-5 shadow-[0_24px_70px_rgba(30,26,20,0.1)] md:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar ? 'الاسم' : 'Name'} value={form.name} onChange={(name) => patch({ name })} required />
        <Field label={ar ? 'الجوال / واتساب' : 'Phone / WhatsApp'} value={form.phone} onChange={(phone) => patch({ phone })} placeholder="+966..." required />
        <Field label={ar ? 'صفتك' : 'Your role'} value={form.role} onChange={(role) => patch({ role })} placeholder={ar ? 'مالك، ممثل مفوض، وسيط...' : 'Owner, authorized representative, broker...'} required />
        <Field label={ar ? 'المدينة أو النطاق العام' : 'City or general area'} value={form.city} onChange={(city) => patch({ city })} placeholder={ar ? 'الرياض، جدة، الخبر...' : 'Riyadh, Jeddah, Khobar...'} required />
        <Field label={ar ? 'نوع العقار' : 'Property type'} value={form.propertyType} onChange={(propertyType) => patch({ propertyType })} placeholder={ar ? 'فيلا، قصر، مزرعة، بنتهاوس...' : 'Villa, estate, farm, penthouse...'} required />
        <Field label={ar ? 'مستوى الخصوصية المفضل' : 'Preferred privacy level'} value={form.privacyPreference} onChange={(privacyPreference) => patch({ privacyPreference })} placeholder={ar ? 'عام بهدوء، رابط خاص، بعد موافقة...' : 'Quiet public page, private link, approval first...'} required />
        <div className="sm:col-span-2">
          <Consent checked={form.originalMediaReady} onChange={(originalMediaReady) => patch({ originalMediaReady })} label={ar ? 'أفهم أن مهاد يفضّل صورًا أصلية مرفوعة مباشرة من المالك أو ممثله، وقد يراجع بياناتها داخليًا للتحقق ولا يعرضها للعامة.' : 'I understand Mihad prefers original media uploaded directly by the owner or representative, and may review metadata privately without displaying it publicly.'} />
        </div>
        <div className="sm:col-span-2">
          <Consent checked={form.consent} onChange={(consent) => patch({ consent })} label={ar ? 'أوافق على أن يتواصل معي مهاد لمراجعة العقار والخصوصية قبل أي نشر أو مشاركة.' : 'I agree that Mihad may contact me to review the property and privacy controls before any publication or sharing.'} />
        </div>
        <TextArea label={ar ? 'ملاحظات خاصة' : 'Private notes'} value={form.notes} onChange={(notes) => patch({ notes })} placeholder={ar ? 'ما الذي يجب حمايته؟ ما الذي يجعل العقار استثنائيًا؟' : 'What should be protected? What makes the property exceptional?'} />
      </div>
      {error ? <p className="mt-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button type="button" onClick={submit} disabled={submitting} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-[#1e1a14] px-4 text-sm font-semibold text-white disabled:opacity-50">
        {submitting ? (ar ? 'جاري الإرسال...' : 'Submitting...') : (ar ? 'إرسال للمراجعة الخاصة' : 'Submit for Private Review')}
      </button>
    </div>
  );
}

export function PrivateInterestForm({ locale, propertySlug = '' }: { locale: string; propertySlug?: string }) {
  const ar = locale === 'ar';
  const [form, setForm] = useState({
    propertySlug,
    fullName: '',
    phone: '',
    location: '',
    intent: '',
    indicativeRange: '',
    fundingStatus: '',
    timeline: '',
    proofReadiness: '',
    ndaOpen: false,
    consent: false,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState('');
  const patch = (update: Partial<typeof form>) => setForm((current) => ({ ...current, ...update }));

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/private-digest/private-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Unable to submit.');
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <SuccessPanel
        result={result}
        title={ar ? 'وصل الاهتمام الخاص.' : 'Private interest received.'}
        body={ar ? 'مهاد سيراجع الهوية والنية والقدرة والوقت قبل أن يقترب من أي مالك.' : 'Mihad will review identity, intent, ability, and timing before approaching any owner.'}
      />
    );
  }

  return (
    <div className="rounded-[8px] border border-[#d7cbb8] bg-white p-5 shadow-[0_24px_70px_rgba(30,26,20,0.1)] md:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar ? 'الاسم الكامل' : 'Full name'} value={form.fullName} onChange={(fullName) => patch({ fullName })} required />
        <Field label={ar ? 'الجوال / واتساب' : 'Phone / WhatsApp'} value={form.phone} onChange={(phone) => patch({ phone })} placeholder="+966..." required />
        <Field label={ar ? 'المدينة / الدولة' : 'City / country'} value={form.location} onChange={(location) => patch({ location })} placeholder={ar ? 'الرياض، دبي، لندن...' : 'Riyadh, Dubai, London...'} required />
        <Field label={ar ? 'النية' : 'Intent'} value={form.intent} onChange={(intent) => patch({ intent })} placeholder={ar ? 'استخدام عائلي، استثمار، مكتب عائلي...' : 'Family use, investment, family office...'} required />
        <Field label={ar ? 'النطاق الإرشادي الخاص' : 'Private indicative range'} value={form.indicativeRange} onChange={(indicativeRange) => patch({ indicativeRange })} placeholder={ar ? 'نطاق خاص وغير ملزم' : 'Private, non-binding range'} required />
        <Field label={ar ? 'وضع التمويل' : 'Funding status'} value={form.fundingStatus} onChange={(fundingStatus) => patch({ fundingStatus })} placeholder={ar ? 'نقدًا، تمويل، مختلط، قيد الموافقة...' : 'Cash, financing, mixed, pending approval...'} required />
        <Field label={ar ? 'الجدول الزمني' : 'Timeline'} value={form.timeline} onChange={(timeline) => patch({ timeline })} placeholder={ar ? 'فوري، 30-90 يوم، 3-6 أشهر...' : 'Immediate, 30-90 days, 3-6 months...'} required />
        <Field label={ar ? 'جاهزية إثبات القدرة' : 'Proof readiness'} value={form.proofReadiness} onChange={(proofReadiness) => patch({ proofReadiness })} placeholder={ar ? 'يمكن التحقق خاصًا عند الحاجة' : 'Can verify privately if needed'} required />
        <div className="sm:col-span-2">
          <Consent checked={form.ndaOpen} onChange={(ndaOpen) => patch({ ndaOpen })} label={ar ? 'أنا منفتح على اتفاقية سرية قبل تفاصيل أعمق مثل العنوان أو هوية المالك أو الزيارة.' : 'I am open to confidentiality terms before deeper details such as address, owner identity, or viewing.'} />
        </div>
        <div className="sm:col-span-2">
          <Consent checked={form.consent} onChange={(consent) => patch({ consent })} label={ar ? 'أوافق على أن يفحص مهاد هذا الاهتمام قبل التواصل مع أي مالك، وأفهم أنه غير ملزم.' : 'I agree that Mihad may screen this interest before approaching any owner, and understand it is non-binding.'} />
        </div>
        <TextArea label={ar ? 'ملاحظات خاصة' : 'Private notes'} value={form.notes} onChange={(notes) => patch({ notes })} placeholder={ar ? 'نوع المنزل أو المدينة أو الخصوصية المطلوبة.' : 'Preferred home type, city, or privacy needs.'} />
      </div>
      {error ? <p className="mt-4 rounded-[8px] bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button type="button" onClick={submit} disabled={submitting} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-[#1e1a14] px-4 text-sm font-semibold text-white disabled:opacity-50">
        {submitting ? (ar ? 'جاري الإرسال...' : 'Submitting...') : (ar ? 'إرسال اهتمام خاص' : 'Submit Private Interest')}
      </button>
    </div>
  );
}
