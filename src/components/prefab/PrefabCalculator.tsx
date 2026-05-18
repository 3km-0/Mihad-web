'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Calculator, CheckCircle2, LockKeyhole, Search, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';
import { LAND_STATUS_OPTIONS, PREFAB_CATEGORIES, PREFAB_PROJECT_TYPES } from '@/lib/prefab-content';
import {
  calculatePrefabProject,
  calculatorResultToRequestQuery,
  type PrefabCalculatorInput,
} from '@/lib/prefab-calculator';
import { isArabic, pickLocalized } from '@/lib/prefab-copy';

type CalculatorPreset = {
  model?: string;
  supplier?: string;
  category?: string;
};

const readinessOptions = [
  { value: 'yes', ar: 'جاهز', en: 'Ready' },
  { value: 'partial', ar: 'جزئيًا', en: 'Partly ready' },
  { value: 'no', ar: 'غير جاهز', en: 'Not ready' },
  { value: 'unknown', ar: 'غير متأكد', en: 'Not sure' },
] as const;

function formatSar(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatTimeline(value: string, ar: boolean) {
  if (!ar) return value;
  if (value.startsWith('6-12')) return '6-12 أسبوعًا بعد تأكيد المورد';
  if (value.startsWith('14-24')) return '14-24 أسبوعًا بعد تثبيت النطاق وجاهزية الموقع';
  if (value.startsWith('10-18')) return '10-18 أسبوعًا بعد تثبيت النطاق وجاهزية الموقع';
  return '6-14 أسبوعًا بعد تثبيت النطاق وجاهزية الموقع';
}

function formatSignal(value: string, ar: boolean) {
  if (!ar) return value.replaceAll('_', ' ');
  const labels: Record<string, string> = {
    budget_range: 'نطاق الميزانية',
    city_or_delivery_location: 'مدينة أو موقع التسليم',
    delivery_and_crane_access_review: 'مراجعة وصول الشاحنات والرافعات',
    land_or_site_fit: 'ملاءمة الأرض أو الموقع',
    site_access: 'وصول الموقع',
    standard_delivery_access: 'وصول تسليم قياسي',
    standard_installation_scope: 'نطاق تركيب قياسي',
    suppliers_with_clear_lease_terms: 'موردون بشروط إيجار واضحة',
    suppliers_with_sale_and_install_scope: 'موردون بنطاق بيع وتركيب واضح',
    target_size: 'المساحة المستهدفة',
    turnkey_or_site_coordination_support: 'دعم تسليم متكامل أو تنسيق موقع',
    utilities_readiness: 'جاهزية الخدمات',
  };
  return labels[value] || value.replaceAll('_', ' ');
}

export function PrefabCalculator({ preset = {} }: { preset?: CalculatorPreset }) {
  const locale = useLocale();
  const ar = isArabic(locale);
  const [form, setForm] = useState<PrefabCalculatorInput>({
    useType: 'retail_kiosk',
    city: '',
    sizeSqm: '120',
    categorySlug: preset.category || 'retail-kiosks',
    timeline: '',
    budgetSar: '',
    landStatus: 'unknown',
    utilitiesReady: 'unknown',
    siteAccessReady: 'unknown',
    commercialPreference: 'not_sure',
    modelReference: preset.model,
    supplierReference: preset.supplier,
  });
  const result = useMemo(() => calculatePrefabProject(form), [form]);
  const patch = (update: Partial<PrefabCalculatorInput>) => setForm((current) => ({ ...current, ...update }));
  const handoffUrl = calculatorResultToRequestQuery(form, result);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[8px] border border-[#D8DEE8] bg-white p-5 shadow-[0_18px_60px_rgba(16,24,39,0.08)]">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#23395D] text-white">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#1D4E89]">{pickLocalized(locale, 'حاسبة مهاد', 'Mihad calculator')}</p>
            <h2 className="text-2xl font-semibold text-[#101827]">{pickLocalized(locale, 'احسب مشروعك الجاهز', 'Estimate your prefab project')}</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm font-semibold text-[#334155]">
            {pickLocalized(locale, 'الاستخدام', 'Use type')}
            <select value={form.useType} onChange={(event) => patch({ useType: event.target.value })} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]">
              {PREFAB_PROJECT_TYPES.filter((type) => !['land_activation', 'supplier_application'].includes(type.value)).map((type) => (
                <option key={type.value} value={type.value}>{ar ? type.labelAr : type.label}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-[#334155]">
              {pickLocalized(locale, 'المدينة', 'City')}
              <input value={form.city} onChange={(event) => patch({ city: event.target.value })} placeholder={pickLocalized(locale, 'الرياض', 'Riyadh')} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#334155]">
              {pickLocalized(locale, 'المساحة التقريبية', 'Approx. size')}
              <input value={form.sizeSqm} onChange={(event) => patch({ sizeSqm: event.target.value })} placeholder="120" className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]" />
            </label>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-[#334155]">
            {pickLocalized(locale, 'نوع الفكرة', 'Concept category')}
            <select value={form.categorySlug} onChange={(event) => patch({ categorySlug: event.target.value })} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]">
              {PREFAB_CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>{ar ? category.titleAr : category.title}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-[#334155]">
              {pickLocalized(locale, 'الميزانية التقريبية', 'Approx. budget')}
              <input value={form.budgetSar} onChange={(event) => patch({ budgetSar: event.target.value })} placeholder="350000" className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]" />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#334155]">
              {pickLocalized(locale, 'متى تحتاجه؟', 'Timeline')}
              <input value={form.timeline} onChange={(event) => patch({ timeline: event.target.value })} placeholder={pickLocalized(locale, 'خلال 3 أشهر', 'Within 3 months')} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]" />
            </label>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-[#334155]">
            {pickLocalized(locale, 'حالة الأرض', 'Land status')}
            <select value={form.landStatus} onChange={(event) => patch({ landStatus: event.target.value as PrefabCalculatorInput['landStatus'] })} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]">
              {LAND_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{ar ? option.labelAr : option.label}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-[#334155]">
              {pickLocalized(locale, 'الخدمات', 'Utilities')}
              <select value={form.utilitiesReady} onChange={(event) => patch({ utilitiesReady: event.target.value as PrefabCalculatorInput['utilitiesReady'] })} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]">
                {readinessOptions.map((option) => <option key={option.value} value={option.value}>{ar ? option.ar : option.en}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#334155]">
              {pickLocalized(locale, 'وصول الموقع', 'Site access')}
              <select value={form.siteAccessReady} onChange={(event) => patch({ siteAccessReady: event.target.value as PrefabCalculatorInput['siteAccessReady'] })} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]">
                {readinessOptions.map((option) => <option key={option.value} value={option.value}>{ar ? option.ar : option.en}</option>)}
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm font-semibold text-[#334155]">
            {pickLocalized(locale, 'تفضيلك التجاري', 'Commercial preference')}
            <select value={form.commercialPreference} onChange={(event) => patch({ commercialPreference: event.target.value as PrefabCalculatorInput['commercialPreference'] })} className="min-h-11 rounded-[8px] border border-[#C8D2E0] bg-white px-3 text-[#101827]">
              <option value="not_sure">{pickLocalized(locale, 'غير متأكد', 'Not sure')}</option>
              <option value="lease">{pickLocalized(locale, 'أفضل الإيجار', 'Prefer lease')}</option>
              <option value="buy">{pickLocalized(locale, 'أفضل الشراء', 'Prefer buy')}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[8px] border border-[#D8DEE8] bg-[#101827] p-5 text-white shadow-[0_18px_60px_rgba(16,24,39,0.14)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#A6E3B8]">
          <Sparkles className="h-4 w-4" />
          {pickLocalized(locale, 'نتيجة تخطيط أولية', 'Planning result')}
        </div>
        <h2 className="mt-3 text-3xl font-semibold">{formatSar(result.prefabRange.low)}-{formatSar(result.prefabRange.high)} SAR</h2>
        <p className="mt-2 text-sm leading-6 text-[#D8DEE8]">{pickLocalized(locale, 'نطاق تخطيطي وليس عرض سعر. يحتاج تأكيد مورد وبيانات موقع.', result.planningNote)}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label={pickLocalized(locale, 'الأساس', 'Base')} value={`${formatSar(result.prefabRange.base)} SAR`} />
          <Metric label={pickLocalized(locale, 'تركيب/إزالة', 'Install/removal')} value={`${formatSar(result.installRemovalAllowance)} SAR`} />
          <Metric label={pickLocalized(locale, 'تجهيز موقع', 'Site prep')} value={`${formatSar(result.sitePrepAllowance)} SAR`} />
        </div>

        <div className="mt-5 rounded-[8px] border border-white/10 bg-white/[0.06] p-4">
          <p className="text-sm font-semibold text-white">{pickLocalized(locale, 'المدة المتوقعة', 'Estimated timeline')}</p>
          <p className="mt-1 text-sm text-[#D8DEE8]">{formatTimeline(result.timelineRange, ar)}</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ResultList title={pickLocalized(locale, 'ملاءمة المورد', 'Supplier fit')} items={result.supplierFit.map((item) => formatSignal(item, ar))} />
          <ResultList title={pickLocalized(locale, 'النواقص', 'Missing info')} items={result.missingInfo.length ? result.missingInfo.map((item) => formatSignal(item, ar)) : [pickLocalized(locale, 'لا توجد نواقص كبيرة', 'No major gaps')]} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/suppliers" className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-white px-4 text-sm font-semibold text-[#101827]">
            <CheckCircle2 className="h-4 w-4" />
            {pickLocalized(locale, 'قارن الموردين', 'Compare suppliers')}
          </Link>
          {result.brief.needsLandHelp ? (
            <Link href={handoffUrl} className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-white/20 px-4 text-sm font-semibold text-white">
              <Search className="h-4 w-4" />
              {pickLocalized(locale, 'احتاج أرض مناسبة', 'Find land for this concept')}
            </Link>
          ) : (
            <Link href={handoffUrl} className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-white/20 px-4 text-sm font-semibold text-white">
              {pickLocalized(locale, 'عندي أرض، كمل التخطيط', 'I have land, continue')}
            </Link>
          )}
          <Link href={handoffUrl} className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-[#A6E3B8]/50 px-4 text-sm font-semibold text-[#A6E3B8]">
            <LockKeyhole className="h-4 w-4" />
            {pickLocalized(locale, 'احفظ كمساحة عمل', 'Save as workspace')}
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-3">
      <p className="text-xs text-[#C8D2E0]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-[6px] bg-white/[0.08] px-3 py-2 text-sm text-[#D8DEE8]">{item}</div>
        ))}
      </div>
    </div>
  );
}
