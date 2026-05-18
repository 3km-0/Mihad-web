'use client';

import { LAND_STATUS_OPTIONS, PREFAB_PROJECT_TYPES, SCOPE_NEEDS } from '@/lib/prefab-content';
import { prefabCopy, pickLocalized } from '@/lib/prefab-copy';
import type { ActivationPartyType } from '@/lib/activation-scoring';
import { audienceOptions, type ActivationIntakeState } from './activation-intake-schema';

type Patch = (update: Partial<ActivationIntakeState>) => void;
type T = (copy: { ar: string; en: string }) => string;

export function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#24352f]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 rounded-[8px] border border-[#d8cfba] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#1f6b4f] focus:ring-2 focus:ring-[#1f6b4f]/10" />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#24352f]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-[8px] border border-[#d8cfba] bg-white px-3 text-sm font-normal outline-none transition focus:border-[#1f6b4f] focus:ring-2 focus:ring-[#1f6b4f]/10">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={`flex items-center gap-3 rounded-[8px] border p-4 text-sm font-semibold ${checked ? 'border-[#1f6b4f] bg-[#eef6ef] text-[#24352f]' : 'border-[#e1dac9] bg-[#fbfaf6] text-[#59645e]'}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function AudienceFields({ form, ar, chooseAudience, patch, t }: { form: ActivationIntakeState; ar: boolean; chooseAudience: (audience: ActivationPartyType) => void; patch: Patch; t: T }) {
  return (
    <div className="grid gap-3">
      {audienceOptions.map((option) => (
        <button key={option.value} type="button" onClick={() => chooseAudience(option.value)} className={`rounded-[8px] border p-4 ${ar ? 'text-right' : 'text-left'} transition ${form.audienceType === option.value ? 'border-[#1f6b4f] bg-[#eef6ef]' : 'border-[#e1dac9] bg-[#fbfaf6] hover:border-[#1f6b4f]'}`}>
          <span className="font-semibold text-[#24352f]">{ar ? option.titleAr : option.title}</span>
          <span className="mt-1 block text-sm text-[#6a746f]">{ar ? option.bodyAr : option.body}</span>
        </button>
      ))}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label={ar ? 'نوع الاستخدام الأقرب' : 'Closest use type'} value={form.projectType} onChange={(value) => patch({ projectType: value })} options={PREFAB_PROJECT_TYPES.map((type) => ({ value: type.value, label: ar ? type.labelAr : type.label }))} />
        <TextField label={t(prefabCopy.rfq.modelReference)} value={form.model_reference} onChange={(value) => patch({ model_reference: value })} placeholder={t(prefabCopy.rfq.modelReferencePlaceholder)} />
      </div>
    </div>
  );
}

export function LocationFields({ form, ar, patch, t }: { form: ActivationIntakeState; ar: boolean; patch: Patch; t: T }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label={t(prefabCopy.rfq.city)} value={form.city} onChange={(value) => patch({ city: value })} placeholder={t(prefabCopy.rfq.cityPlaceholder)} />
      <TextField label={ar ? 'الحي / النطاق' : 'District / area'} value={form.district} onChange={(value) => patch({ district: value })} placeholder={ar ? 'السلي، الملز، شمال الرياض...' : 'Al Sulay, Olaya, north Riyadh...'} />
      {form.audienceType === 'supplier' ? (
        <TextField label={ar ? 'المناطق التي تخدمها' : 'Regions served'} value={form.service_areas} onChange={(value) => patch({ service_areas: value })} placeholder={ar ? 'الرياض، الشرقية، مكة...' : 'Riyadh, Eastern Province, Makkah...'} />
      ) : (
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold text-[#24352f]">{t(prefabCopy.rfq.ownLand)}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {LAND_STATUS_OPTIONS.map((option) => (
              <button key={option.value} type="button" onClick={() => patch({ land_status: option.value })} className={`rounded-[8px] border p-4 ${ar ? 'text-right' : 'text-left'} ${form.land_status === option.value ? 'border-[#1f6b4f] bg-[#eef6ef]' : 'border-[#e1dac9] bg-[#fbfaf6]'}`}>
                <span className="font-semibold">{ar ? option.labelAr : option.label}</span>
                <span className="mt-1 block text-sm text-[#6a746f]">{ar ? option.label : option.labelAr}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PathFields({ form, ar, patch, t }: { form: ActivationIntakeState; ar: boolean; patch: Patch; t: T }) {
  if (form.audienceType === 'supplier') {
    return <div className="grid gap-4 sm:grid-cols-2"><TextField label={ar ? 'أنواع الوحدات والمقاسات' : 'Unit types and sizes'} value={form.unit_types} onChange={(value) => patch({ unit_types: value })} placeholder={ar ? 'مكاتب، أكشاك، كابن، سكن عمال...' : 'Offices, kiosks, cabins, staff housing...'} /><TextField label={ar ? 'مدة التسليم' : 'Delivery timeline'} value={form.timeline} onChange={(value) => patch({ timeline: value })} placeholder={t(prefabCopy.rfq.timelinePlaceholder)} /><TextField label={ar ? 'تكلفة التركيب / الإزالة' : 'Install / removal terms'} value={form.installation_terms} onChange={(value) => patch({ installation_terms: value })} placeholder={ar ? 'حسب الموقع، سعر ثابت، مشمول...' : 'Site-based, fixed, included...'} /><TextField label={ar ? 'الصيانة وخدمة ما بعد البيع' : 'Maintenance SLA'} value={form.maintenance_sla} onChange={(value) => patch({ maintenance_sla: value })} placeholder={ar ? 'زيارة خلال 48 ساعة، ضمان سنة...' : '48-hour visit, one-year warranty...'} /></div>;
  }
  if (form.audienceType === 'landowner') {
    return <div className="grid gap-4 sm:grid-cols-2"><TextField label={ar ? 'مساحة الأرض' : 'Plot size'} value={form.required_land_area_sqm} onChange={(value) => patch({ required_land_area_sqm: value })} placeholder={ar ? '2500 م²' : '2500 sqm'} /><TextField label={ar ? 'حالة الملكية' : 'Ownership status'} value={form.land_ownership_status} onChange={(value) => patch({ land_ownership_status: value })} placeholder={ar ? 'صك، ورثة، وكالة...' : 'Title deed, heirs, proxy...'} /><TextField label={ar ? 'الاستخدام الحالي / التصنيف' : 'Current use / zoning'} value={form.zoning_use} onChange={(value) => patch({ zoning_use: value })} placeholder={ar ? 'تجاري، صناعي خفيف، أرض فضاء...' : 'Commercial, light industrial, vacant...'} /><TextField label={ar ? 'الوصول والواجهة' : 'Access and frontage'} value={form.access_frontage} onChange={(value) => patch({ access_frontage: value })} placeholder={ar ? 'شارع 30م، زاوية، مدخل شاحنات...' : '30m street, corner, truck access...'} /><TextField label={ar ? 'الخدمات' : 'Utilities'} value={form.utilities_status} onChange={(value) => patch({ utilities_status: value })} placeholder={ar ? 'كهرباء، ماء، صرف، غير متوفر...' : 'Power, water, sewage, unavailable...'} /></div>;
  }
  return <div className="grid gap-4 sm:grid-cols-2"><TextField label={ar ? 'النشاط التجاري' : 'Business activity'} value={form.business_activity} onChange={(value) => patch({ business_activity: value })} placeholder={ar ? 'معرض سيارات، تأجير معدات، مكتب مشروع...' : 'Vehicle showroom, equipment rental, project office...'} /><TextField label={ar ? 'حالة السجل التجاري' : 'CR status'} value={form.cr_status} onChange={(value) => patch({ cr_status: value })} placeholder={ar ? 'قائم، تحت التأسيس، غير مطلوب...' : 'Active, forming, not required...'} /><TextField label={ar ? 'مساحة الأرض المطلوبة' : 'Required land area'} value={form.required_land_area_sqm} onChange={(value) => patch({ required_land_area_sqm: value })} placeholder={ar ? '1200 م²' : '1200 sqm'} /><TextField label={t(prefabCopy.rfq.targetSize)} value={form.size_sqm} onChange={(value) => patch({ size_sqm: value })} placeholder={t(prefabCopy.rfq.targetSizePlaceholder)} /><TextField label={t(prefabCopy.rfq.useCase)} value={form.use_case} onChange={(value) => patch({ use_case: value })} placeholder={t(prefabCopy.rfq.useCasePlaceholder)} /><TextField label={ar ? 'الخدمات / الوصول / اللوحات' : 'Utilities / access / signage'} value={form.access_frontage} onChange={(value) => patch({ access_frontage: value })} placeholder={ar ? 'واجهة شارع، كهرباء، ماء، لوحة...' : 'Street frontage, power, water, sign visibility...'} /></div>;
}

export function EconomicsFields({ form, ar, patch, t }: { form: ActivationIntakeState; ar: boolean; patch: Patch; t: T }) {
  return <div className="grid gap-4 sm:grid-cols-2"><TextField label={ar ? 'دخل / ميزانية شهرية متوقعة' : 'Expected monthly rent / budget'} value={form.monthly_budget} onChange={(value) => patch({ monthly_budget: value, tenant_monthly_rent: value })} placeholder={ar ? '45000 ريال شهريًا' : '45000 SAR / month'} /><TextField label={form.audienceType === 'landowner' ? (ar ? 'توقع إيجار الأرض' : 'Land rent expectation') : t(prefabCopy.rfq.budgetMax)} value={form.audienceType === 'landowner' ? form.rent_expectation : form.budgetMax} onChange={(value) => form.audienceType === 'landowner' ? patch({ rent_expectation: value, land_rent: value }) : patch({ budgetMax: value })} placeholder={ar ? '15000 ريال شهريًا' : '15000 SAR / month'} /><TextField label={ar ? 'إيجار الوحدة الجاهزة' : 'Modular unit lease'} value={form.modular_unit_lease} onChange={(value) => patch({ modular_unit_lease: value })} placeholder={ar ? '18000 ريال شهريًا' : '18000 SAR / month'} /><TextField label={ar ? 'تقسيط التركيب والإزالة شهريًا' : 'Install/removal amortized monthly'} value={form.install_removal_amortization} onChange={(value) => patch({ install_removal_amortization: value })} placeholder={ar ? '3000 ريال' : '3000 SAR'} /><TextField label={ar ? 'احتياطي صيانة وتأمين' : 'Insurance/maintenance reserve'} value={form.maintenance_reserve} onChange={(value) => patch({ maintenance_reserve: value })} placeholder={ar ? '2500 ريال' : '2500 SAR'} /><TextField label={ar ? 'هدف تغطية التكاليف' : 'Target fixed-cost coverage'} value={form.target_coverage} onChange={(value) => patch({ target_coverage: value })} placeholder="1.5" /><TextField label={ar ? 'مدة الإيجار بالأشهر' : 'Lease term in months'} value={form.lease_term_months} onChange={(value) => patch({ lease_term_months: value })} placeholder={ar ? '12، 24، 36' : '12, 24, 36'} /><TextField label={ar ? 'الاحتياطي المتاح بالأشهر' : 'Reserve available in months'} value={form.reserve_months} onChange={(value) => patch({ reserve_months: value })} placeholder={ar ? '3 أو 6 أشهر' : '3 or 6 months'} /><div className="sm:col-span-2"><TextField label={t(prefabCopy.rfq.timeline)} value={form.timeline} onChange={(value) => patch({ timeline: value })} placeholder={t(prefabCopy.rfq.timelinePlaceholder)} /></div></div>;
}

export function RightsChecklistFields({ form, ar, patch, t, toggleScope }: { form: ActivationIntakeState; ar: boolean; patch: Patch; t: T; toggleScope: (value: string) => void }) {
  const toggles: Array<[keyof ActivationIntakeState, string, string]> = [['tenant_commitment', 'يوجد التزام أو طلب مؤكد من مستأجر', 'Confirmed tenant commitment or real demand'], ['permit_path', 'مسار التصريح واضح مبدئيًا', 'Permit path is preliminarily clear'], ['modular_install_permission', 'مسموح تركيب وحدات جاهزة', 'Modular installation is allowed'], ['sublease_permission', 'مسموح التأجير من الباطن', 'Sublease right is allowed'], ['removal_rights', 'حق الإزالة والخروج واضح', 'Removal and exit rights are clear'], ['revenue_share_open', 'أقبل إيراد متغير أو مشاركة دخل', 'Open to revenue share'], ['lease_pricing_available', 'المورد يقدم تسعير إيجار واضح', 'Supplier has clear lease pricing'], ['supplier_flexible_lease', 'المورد مرن في مدة الإيجار', 'Supplier can support flexible lease terms'], ['drawings_available', 'مخططات أو مواصفات متوفرة', 'Drawings or specs are available'], ['location_flexibility', 'الموقع قابل للتغيير', 'Location can be flexible']];
  return <div className="grid gap-5"><div className="grid gap-3 sm:grid-cols-2">{toggles.map(([key, arLabel, enLabel]) => <ToggleField key={key} label={ar ? arLabel : enLabel} checked={Boolean(form[key])} onChange={(value) => patch({ [key]: value } as Partial<ActivationIntakeState>)} />)}</div><div><p className="mb-3 text-sm font-semibold text-[#24352f]">{t(prefabCopy.rfq.scopeHelp)}</p><div className="grid gap-3 sm:grid-cols-2">{SCOPE_NEEDS.map((scope) => <button key={scope.value} type="button" onClick={() => toggleScope(scope.value)} className={`rounded-[8px] border p-4 ${ar ? 'text-right' : 'text-left'} ${form.scopeNeeds.includes(scope.value) ? 'border-[#1f6b4f] bg-[#eef6ef]' : 'border-[#e1dac9] bg-[#fbfaf6]'}`}><span className="font-semibold">{ar ? scope.labelAr : scope.label}</span><span className="mt-1 block text-sm text-[#6a746f]">{ar ? scope.label : scope.labelAr}</span></button>)}</div></div><TextField label={ar ? 'جاهزية العربون / الدفعة الأولى' : 'Deposit readiness'} value={form.deposit_readiness} onChange={(value) => patch({ deposit_readiness: value })} placeholder={ar ? 'جاهز شهرين، يحتاج موافقة، غير جاهز...' : 'Two months ready, needs approval, not ready...'} /></div>;
}

export function ContactFields({ form, patch, t }: { form: ActivationIntakeState; patch: Patch; t: T }) {
  return <div className="grid gap-4 sm:grid-cols-2"><TextField label={t(prefabCopy.rfq.name)} value={form.name} onChange={(value) => patch({ name: value })} placeholder={t(prefabCopy.rfq.namePlaceholder)} /><TextField label={t(prefabCopy.rfq.phone)} value={form.phone} onChange={(value) => patch({ phone: value })} placeholder="+966..." /><TextField label={t(prefabCopy.rfq.email)} value={form.email} onChange={(value) => patch({ email: value })} placeholder="name@example.com" /><label className="flex items-center gap-3 rounded-[8px] border border-[#e1dac9] bg-[#fbfaf6] p-4"><input type="checkbox" checked={form.whatsappPreferred} onChange={(event) => patch({ whatsappPreferred: event.target.checked })} /><span className="text-sm font-semibold text-[#24352f]">{t(prefabCopy.rfq.whatsappPreferred)}</span></label><div className="sm:col-span-2"><label className="grid gap-2 text-sm font-semibold text-[#24352f]">{t(prefabCopy.rfq.notes)}<textarea value={form.notes} onChange={(event) => patch({ notes: event.target.value })} className="min-h-28 rounded-[8px] border border-[#d8cfba] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f6b4f]" /></label></div></div>;
}

export function localized(locale: string) {
  return (copy: { ar: string; en: string }) => pickLocalized(locale, copy.ar, copy.en);
}
