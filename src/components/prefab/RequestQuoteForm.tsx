'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { LAND_STATUS_OPTIONS, PREFAB_PROJECT_TYPES, PREFAB_WHATSAPP_URL, SCOPE_NEEDS } from '@/lib/prefab-content';
import { isArabic, prefabCopy, pickLocalized } from '@/lib/prefab-copy';
import type { ActivationPartyType } from '@/lib/activation-scoring';

type RfqFormState = {
  audienceType: ActivationPartyType;
  projectType: string;
  city: string;
  district: string;
  landStatus: string;
  businessActivity: string;
  crStatus: string;
  requiredLandAreaSqm: string;
  sizeSqm: string;
  rooms: string;
  useCase: string;
  styleReference: string;
  modelReference: string;
  monthlyBudget: string;
  budgetMin: string;
  budgetMax: string;
  leaseTermMonths: string;
  timeline: string;
  depositReadiness: string;
  locationFlexibility: boolean;
  tenantCommitment: boolean;
  permitPath: boolean;
  landOwnershipStatus: string;
  accessFrontage: string;
  utilitiesStatus: string;
  zoningUse: string;
  rentExpectation: string;
  revenueShareOpen: boolean;
  modularInstallPermission: boolean;
  subleasePermission: boolean;
  removalRights: boolean;
  unitTypes: string;
  leasePricingAvailable: boolean;
  installationTerms: string;
  maintenanceSla: string;
  drawingsAvailable: boolean;
  serviceAreas: string;
  supplierFlexibleLease: boolean;
  tenantMonthlyRent: string;
  landRent: string;
  modularUnitLease: string;
  installRemovalAmortization: string;
  maintenanceReserve: string;
  targetCoverage: string;
  reserveMonths: string;
  scopeNeeds: string[];
  name: string;
  phone: string;
  email: string;
  whatsappPreferred: boolean;
  notes: string;
};

const audienceOptions: Array<{
  value: ActivationPartyType;
  titleAr: string;
  title: string;
  bodyAr: string;
  body: string;
  projectType: string;
}> = [
  {
    value: 'tenant',
    titleAr: 'أحتاج موقع تجاري',
    title: 'I need a commercial site',
    bodyAr: 'شركة أو نشاط يبحث عن أرض ووحدة جاهزة وتشغيل سريع.',
    body: 'A business looking for land, a modular unit, and fast activation.',
    projectType: 'commercial_site',
  },
  {
    value: 'landowner',
    titleAr: 'عندي أرض',
    title: 'I own land',
    bodyAr: 'مالك أرض تجارية أو شبه تجارية يريد تفعيلها بدخل واضح.',
    body: 'A landowner who wants to activate an idle plot with a clear income path.',
    projectType: 'land_activation',
  },
  {
    value: 'supplier',
    titleAr: 'أنا مورد مباني جاهزة',
    title: 'I provide modular units',
    bodyAr: 'مصنع أو مورد وحدات جاهزة للتأجير أو البيع والتركيب.',
    body: 'A modular supplier offering lease, sale, delivery, or installation.',
    projectType: 'supplier_application',
  },
];

const initialState: RfqFormState = {
  audienceType: 'tenant',
  projectType: 'commercial_site',
  city: '',
  district: '',
  landStatus: 'needed',
  businessActivity: '',
  crStatus: '',
  requiredLandAreaSqm: '',
  sizeSqm: '',
  rooms: '',
  useCase: '',
  styleReference: '',
  modelReference: '',
  monthlyBudget: '',
  budgetMin: '',
  budgetMax: '',
  leaseTermMonths: '',
  timeline: '',
  depositReadiness: '',
  locationFlexibility: false,
  tenantCommitment: false,
  permitPath: false,
  landOwnershipStatus: '',
  accessFrontage: '',
  utilitiesStatus: '',
  zoningUse: '',
  rentExpectation: '',
  revenueShareOpen: false,
  modularInstallPermission: false,
  subleasePermission: false,
  removalRights: false,
  unitTypes: '',
  leasePricingAvailable: false,
  installationTerms: '',
  maintenanceSla: '',
  drawingsAvailable: false,
  serviceAreas: '',
  supplierFlexibleLease: false,
  tenantMonthlyRent: '',
  landRent: '',
  modularUnitLease: '',
  installRemovalAmortization: '',
  maintenanceReserve: '',
  targetCoverage: '1.5',
  reserveMonths: '',
  scopeNeeds: [],
  name: '',
  phone: '',
  email: '',
  whatsappPreferred: true,
  notes: '',
};

function audienceFromInitial(value?: string): ActivationPartyType {
  if (value === 'landowner' || value === 'supplier' || value === 'tenant') return value;
  if (value === 'land_activation') return 'landowner';
  if (value === 'supplier_application') return 'supplier';
  return 'tenant';
}

function projectTypeForAudience(audience: ActivationPartyType, fallback?: string) {
  if (fallback && PREFAB_PROJECT_TYPES.some((type) => type.value === fallback)) return fallback;
  return audienceOptions.find((option) => option.value === audience)?.projectType || 'commercial_site';
}

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
  const t = (copy: { ar: string; en: string }) => pickLocalized(locale, copy.ar, copy.en);
  const steps = prefabCopy.rfq.steps[ar ? 'ar' : 'en'];
  const startingAudience = audienceFromInitial(initialAudience || initialProjectType);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RfqFormState>({
    ...initialState,
    audienceType: startingAudience,
    projectType: projectTypeForAudience(startingAudience, initialProjectType),
    modelReference: initialModel || '',
    notes: initialSupplier ? `Interested supplier id: ${initialSupplier}` : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ rfq_id: string; whatsapp_url?: string; route_recommendation?: string } | null>(null);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(form.audienceType);
    if (step === 1) return Boolean(form.city.trim() || form.district.trim() || form.serviceAreas.trim());
    if (step === 2) {
      if (form.audienceType === 'tenant') return Boolean(form.businessActivity.trim() || form.useCase.trim());
      if (form.audienceType === 'landowner') return Boolean(form.requiredLandAreaSqm.trim() || form.zoningUse.trim() || form.landOwnershipStatus.trim());
      return Boolean(form.unitTypes.trim() || form.serviceAreas.trim());
    }
    if (step === 3) {
      if (form.audienceType === 'supplier') return Boolean(form.leasePricingAvailable || form.monthlyBudget.trim() || form.budgetMax.trim());
      return Boolean(form.monthlyBudget.trim() || form.budgetMax.trim() || form.rentExpectation.trim());
    }
    if (step === 5) return Boolean(form.name.trim() && form.phone.trim());
    return true;
  }, [form, step]);

  const patch = (update: Partial<RfqFormState>) => setForm((current) => ({ ...current, ...update }));
  const chooseAudience = (audienceType: ActivationPartyType) => {
    patch({
      audienceType,
      projectType: projectTypeForAudience(audienceType),
      landStatus: audienceType === 'landowner' ? 'owned' : audienceType === 'supplier' ? 'unknown' : 'needed',
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
      const response = await fetch('/api/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience_type: form.audienceType,
          project_type: form.projectType,
          city: form.city,
          district: form.district,
          land_status: form.landStatus,
          business_activity: form.businessActivity,
          cr_status: form.crStatus,
          required_land_area_sqm: form.requiredLandAreaSqm,
          size_sqm: form.sizeSqm,
          rooms: form.rooms,
          use_case: form.useCase,
          style_reference: form.styleReference,
          model_reference: form.modelReference,
          budget_range: { min: form.budgetMin, max: form.budgetMax || form.monthlyBudget, currency: 'SAR' },
          monthly_budget: form.monthlyBudget,
          lease_term_months: form.leaseTermMonths,
          timeline: form.timeline,
          deposit_readiness: form.depositReadiness,
          location_flexibility: form.locationFlexibility,
          tenant_commitment: form.tenantCommitment,
          permit_path: form.permitPath,
          land_ownership_status: form.landOwnershipStatus,
          access_frontage: form.accessFrontage,
          utilities_status: form.utilitiesStatus,
          zoning_use: form.zoningUse,
          rent_expectation: form.rentExpectation,
          revenue_share_open: form.revenueShareOpen,
          modular_install_permission: form.modularInstallPermission,
          sublease_permission: form.subleasePermission,
          removal_rights: form.removalRights,
          unit_types: form.unitTypes,
          lease_pricing_available: form.leasePricingAvailable,
          installation_terms: form.installationTerms,
          maintenance_sla: form.maintenanceSla,
          drawings_available: form.drawingsAvailable,
          service_areas: form.serviceAreas,
          supplier_flexible_lease: form.supplierFlexibleLease,
          tenant_monthly_rent: form.tenantMonthlyRent || form.monthlyBudget,
          land_rent: form.landRent || form.rentExpectation,
          modular_unit_lease: form.modularUnitLease,
          install_removal_amortization: form.installRemovalAmortization,
          maintenance_reserve: form.maintenanceReserve,
          target_coverage: form.targetCoverage,
          reserve_months: form.reserveMonths,
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
        <p className="mt-2 text-lg text-[#59645e]">{t(prefabCopy.rfq.successBody)}</p>
        <div className="mt-6 grid gap-3 rounded-[8px] bg-[#f5f1e7] p-4 text-sm text-[#59645e]">
          <p>{t(prefabCopy.rfq.reference)}: <span className="font-mono text-[#24352f]">{result.rfq_id}</span></p>
          {result.route_recommendation ? <p>{ar ? 'المسار المبدئي' : 'Initial route'}: <span className="font-semibold text-[#24352f]">{result.route_recommendation}</span></p> : null}
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
          <div className="grid gap-3">
            {audienceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => chooseAudience(option.value)}
                className={`rounded-[8px] border p-4 ${ar ? 'text-right' : 'text-left'} transition ${form.audienceType === option.value ? 'border-[#1f6b4f] bg-[#eef6ef]' : 'border-[#e1dac9] bg-[#fbfaf6] hover:border-[#1f6b4f]'}`}
              >
                <span className="font-semibold text-[#24352f]">{ar ? option.titleAr : option.title}</span>
                <span className="mt-1 block text-sm text-[#6a746f]">{ar ? option.bodyAr : option.body}</span>
              </button>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label={ar ? 'نوع الاستخدام الأقرب' : 'Closest use type'}
                value={form.projectType}
                onChange={(value) => patch({ projectType: value })}
                options={PREFAB_PROJECT_TYPES.map((type) => ({ value: type.value, label: ar ? type.labelAr : type.label }))}
              />
              <TextField label={t(prefabCopy.rfq.modelReference)} value={form.modelReference} onChange={(value) => patch({ modelReference: value })} placeholder={t(prefabCopy.rfq.modelReferencePlaceholder)} />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t(prefabCopy.rfq.city)} value={form.city} onChange={(value) => patch({ city: value })} placeholder={t(prefabCopy.rfq.cityPlaceholder)} />
            <TextField label={ar ? 'الحي / النطاق' : 'District / area'} value={form.district} onChange={(value) => patch({ district: value })} placeholder={ar ? 'السلي، الملز، شمال الرياض...' : 'Al Sulay, Olaya, north Riyadh...'} />
            {form.audienceType === 'supplier' ? (
              <TextField label={ar ? 'المناطق التي تخدمها' : 'Regions served'} value={form.serviceAreas} onChange={(value) => patch({ serviceAreas: value })} placeholder={ar ? 'الرياض، الشرقية، مكة...' : 'Riyadh, Eastern Province, Makkah...'} />
            ) : (
              <div className="sm:col-span-2">
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
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {form.audienceType === 'tenant' ? (
              <>
                <TextField label={ar ? 'النشاط التجاري' : 'Business activity'} value={form.businessActivity} onChange={(value) => patch({ businessActivity: value })} placeholder={ar ? 'معرض سيارات، تأجير معدات، مكتب مشروع...' : 'Vehicle showroom, equipment rental, project office...'} />
                <TextField label={ar ? 'حالة السجل التجاري' : 'CR status'} value={form.crStatus} onChange={(value) => patch({ crStatus: value })} placeholder={ar ? 'قائم، تحت التأسيس، غير مطلوب...' : 'Active, forming, not required...'} />
                <TextField label={ar ? 'مساحة الأرض المطلوبة' : 'Required land area'} value={form.requiredLandAreaSqm} onChange={(value) => patch({ requiredLandAreaSqm: value })} placeholder={ar ? '1200 م²' : '1200 sqm'} />
                <TextField label={t(prefabCopy.rfq.targetSize)} value={form.sizeSqm} onChange={(value) => patch({ sizeSqm: value })} placeholder={t(prefabCopy.rfq.targetSizePlaceholder)} />
                <TextField label={t(prefabCopy.rfq.useCase)} value={form.useCase} onChange={(value) => patch({ useCase: value })} placeholder={t(prefabCopy.rfq.useCasePlaceholder)} />
                <TextField label={ar ? 'الخدمات / الوصول / اللوحات' : 'Utilities / access / signage'} value={form.accessFrontage} onChange={(value) => patch({ accessFrontage: value })} placeholder={ar ? 'واجهة شارع، كهرباء، ماء، لوحة...' : 'Street frontage, power, water, sign visibility...'} />
              </>
            ) : null}
            {form.audienceType === 'landowner' ? (
              <>
                <TextField label={ar ? 'مساحة الأرض' : 'Plot size'} value={form.requiredLandAreaSqm} onChange={(value) => patch({ requiredLandAreaSqm: value })} placeholder={ar ? '2500 م²' : '2500 sqm'} />
                <TextField label={ar ? 'حالة الملكية' : 'Ownership status'} value={form.landOwnershipStatus} onChange={(value) => patch({ landOwnershipStatus: value })} placeholder={ar ? 'صك، ورثة، وكالة...' : 'Title deed, heirs, proxy...'} />
                <TextField label={ar ? 'الاستخدام الحالي / التصنيف' : 'Current use / zoning'} value={form.zoningUse} onChange={(value) => patch({ zoningUse: value })} placeholder={ar ? 'تجاري، صناعي خفيف، أرض فضاء...' : 'Commercial, light industrial, vacant...'} />
                <TextField label={ar ? 'الوصول والواجهة' : 'Access and frontage'} value={form.accessFrontage} onChange={(value) => patch({ accessFrontage: value })} placeholder={ar ? 'شارع 30م، زاوية، مدخل شاحنات...' : '30m street, corner, truck access...'} />
                <TextField label={ar ? 'الخدمات' : 'Utilities'} value={form.utilitiesStatus} onChange={(value) => patch({ utilitiesStatus: value })} placeholder={ar ? 'كهرباء، ماء، صرف، غير متوفر...' : 'Power, water, sewage, unavailable...'} />
              </>
            ) : null}
            {form.audienceType === 'supplier' ? (
              <>
                <TextField label={ar ? 'أنواع الوحدات والمقاسات' : 'Unit types and sizes'} value={form.unitTypes} onChange={(value) => patch({ unitTypes: value })} placeholder={ar ? 'مكاتب، أكشاك، كابن، سكن عمال...' : 'Offices, kiosks, cabins, staff housing...'} />
                <TextField label={ar ? 'مدة التسليم' : 'Delivery timeline'} value={form.timeline} onChange={(value) => patch({ timeline: value })} placeholder={t(prefabCopy.rfq.timelinePlaceholder)} />
                <TextField label={ar ? 'تكلفة التركيب / الإزالة' : 'Install / removal terms'} value={form.installationTerms} onChange={(value) => patch({ installationTerms: value })} placeholder={ar ? 'حسب الموقع، سعر ثابت، مشمول...' : 'Site-based, fixed, included...'} />
                <TextField label={ar ? 'الصيانة وخدمة ما بعد البيع' : 'Maintenance SLA'} value={form.maintenanceSla} onChange={(value) => patch({ maintenanceSla: value })} placeholder={ar ? 'زيارة خلال 48 ساعة، ضمان سنة...' : '48-hour visit, one-year warranty...'} />
              </>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={ar ? 'دخل / ميزانية شهرية متوقعة' : 'Expected monthly rent / budget'} value={form.monthlyBudget} onChange={(value) => patch({ monthlyBudget: value, tenantMonthlyRent: value })} placeholder={ar ? '45000 ريال شهريًا' : '45000 SAR / month'} />
            <TextField label={form.audienceType === 'landowner' ? (ar ? 'توقع إيجار الأرض' : 'Land rent expectation') : t(prefabCopy.rfq.budgetMax)} value={form.audienceType === 'landowner' ? form.rentExpectation : form.budgetMax} onChange={(value) => form.audienceType === 'landowner' ? patch({ rentExpectation: value, landRent: value }) : patch({ budgetMax: value })} placeholder={ar ? '15000 ريال شهريًا' : '15000 SAR / month'} />
            <TextField label={ar ? 'إيجار الوحدة الجاهزة' : 'Modular unit lease'} value={form.modularUnitLease} onChange={(value) => patch({ modularUnitLease: value })} placeholder={ar ? '18000 ريال شهريًا' : '18000 SAR / month'} />
            <TextField label={ar ? 'تقسيط التركيب والإزالة شهريًا' : 'Install/removal amortized monthly'} value={form.installRemovalAmortization} onChange={(value) => patch({ installRemovalAmortization: value })} placeholder={ar ? '3000 ريال' : '3000 SAR'} />
            <TextField label={ar ? 'احتياطي صيانة وتأمين' : 'Insurance/maintenance reserve'} value={form.maintenanceReserve} onChange={(value) => patch({ maintenanceReserve: value })} placeholder={ar ? '2500 ريال' : '2500 SAR'} />
            <TextField label={ar ? 'هدف تغطية التكاليف' : 'Target fixed-cost coverage'} value={form.targetCoverage} onChange={(value) => patch({ targetCoverage: value })} placeholder="1.5" />
            <TextField label={ar ? 'مدة الإيجار بالأشهر' : 'Lease term in months'} value={form.leaseTermMonths} onChange={(value) => patch({ leaseTermMonths: value })} placeholder={ar ? '12، 24، 36' : '12, 24, 36'} />
            <TextField label={ar ? 'الاحتياطي المتاح بالأشهر' : 'Reserve available in months'} value={form.reserveMonths} onChange={(value) => patch({ reserveMonths: value })} placeholder={ar ? '3 أو 6 أشهر' : '3 or 6 months'} />
            <div className="sm:col-span-2">
              <TextField label={t(prefabCopy.rfq.timeline)} value={form.timeline} onChange={(value) => patch({ timeline: value })} placeholder={t(prefabCopy.rfq.timelinePlaceholder)} />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField label={ar ? 'يوجد التزام أو طلب مؤكد من مستأجر' : 'Confirmed tenant commitment or real demand'} checked={form.tenantCommitment} onChange={(value) => patch({ tenantCommitment: value })} />
              <ToggleField label={ar ? 'مسار التصريح واضح مبدئيًا' : 'Permit path is preliminarily clear'} checked={form.permitPath} onChange={(value) => patch({ permitPath: value })} />
              <ToggleField label={ar ? 'مسموح تركيب وحدات جاهزة' : 'Modular installation is allowed'} checked={form.modularInstallPermission} onChange={(value) => patch({ modularInstallPermission: value })} />
              <ToggleField label={ar ? 'مسموح التأجير من الباطن' : 'Sublease right is allowed'} checked={form.subleasePermission} onChange={(value) => patch({ subleasePermission: value })} />
              <ToggleField label={ar ? 'حق الإزالة والخروج واضح' : 'Removal and exit rights are clear'} checked={form.removalRights} onChange={(value) => patch({ removalRights: value })} />
              <ToggleField label={ar ? 'أقبل إيراد متغير أو مشاركة دخل' : 'Open to revenue share'} checked={form.revenueShareOpen} onChange={(value) => patch({ revenueShareOpen: value })} />
              <ToggleField label={ar ? 'المورد يقدم تسعير إيجار واضح' : 'Supplier has clear lease pricing'} checked={form.leasePricingAvailable} onChange={(value) => patch({ leasePricingAvailable: value })} />
              <ToggleField label={ar ? 'المورد مرن في مدة الإيجار' : 'Supplier can support flexible lease terms'} checked={form.supplierFlexibleLease} onChange={(value) => patch({ supplierFlexibleLease: value })} />
              <ToggleField label={ar ? 'مخططات أو مواصفات متوفرة' : 'Drawings or specs are available'} checked={form.drawingsAvailable} onChange={(value) => patch({ drawingsAvailable: value })} />
              <ToggleField label={ar ? 'الموقع قابل للتغيير' : 'Location can be flexible'} checked={form.locationFlexibility} onChange={(value) => patch({ locationFlexibility: value })} />
            </div>
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
            <TextField label={ar ? 'جاهزية العربون / الدفعة الأولى' : 'Deposit readiness'} value={form.depositReadiness} onChange={(value) => patch({ depositReadiness: value })} placeholder={ar ? 'جاهز شهرين، يحتاج موافقة، غير جاهز...' : 'Two months ready, needs approval, not ready...'} />
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

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#24352f]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-[8px] border border-[#d8cfba] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#1f6b4f] focus:ring-2 focus:ring-[#1f6b4f]/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`flex items-center gap-3 rounded-[8px] border p-4 text-sm font-semibold ${checked ? 'border-[#1f6b4f] bg-[#eef6ef] text-[#24352f]' : 'border-[#e1dac9] bg-[#fbfaf6] text-[#59645e]'}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
