export type LocaleCode = 'ar' | 'en';

export type PropertyVisibility = 'public' | 'private_link';
export type PropertyStatus = 'approved' | 'editorial_preview';

export type PrivateProperty = {
  slug: string;
  title: { ar: string; en: string };
  cityArea: { ar: string; en: string };
  propertyType: { ar: string; en: string };
  visibility: PropertyVisibility;
  status: PropertyStatus;
  heroImage: string;
  galleryImages: string[];
  story: { ar: string; en: string };
  highlights: Array<{ ar: string; en: string }>;
  featureSummary: Array<{ label: { ar: string; en: string }; value: { ar: string; en: string } }>;
  privacyNotes: Array<{ ar: string; en: string }>;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

export type OwnerSubmission = {
  name: string;
  phone: string;
  role: string;
  city: string;
  propertyType: string;
  privacyPreference: string;
  originalMediaReady: boolean;
  consent: boolean;
  notes: string;
};

export type PrivateInterest = {
  propertySlug: string;
  fullName: string;
  phone: string;
  location: string;
  intent: string;
  indicativeRange: string;
  fundingStatus: string;
  timeline: string;
  proofReadiness: string;
  ndaOpen: boolean;
  consent: boolean;
  notes: string;
};

export function localize(locale: string, ar: string, en: string) {
  return locale === 'ar' ? ar : en;
}

export function localizedValue(locale: string, value: { ar: string; en: string }) {
  return localize(locale, value.ar, value.en);
}

export const PRIVATE_DIGEST_WHATSAPP_URL = 'https://wa.me/966500000000';

export const privateProperties: PrivateProperty[] = [
  {
    slug: 'editorial-format-preview',
    title: {
      ar: 'معاينة تنسيق تحريري خاص',
      en: 'Private editorial format preview',
    },
    cityArea: {
      ar: 'الموقع مخفي للخصوصية',
      en: 'Location hidden for privacy',
    },
    propertyType: {
      ar: 'منزل استثنائي',
      en: 'Exceptional home',
    },
    visibility: 'private_link',
    status: 'editorial_preview',
    heroImage: '/onboarding/workspace.jpg',
    galleryImages: ['/onboarding/workspace.jpg'],
    story: {
      ar: 'هذه الصفحة توضّح شكل العرض التحريري فقط. لا تمثل عقارًا متاحًا، ولا تعرض سعرًا أو مالكًا أو عنوانًا. الهدف هو اختبار لغة مهاد الخاصة قبل نشر أي منزل حقيقي بموافقة صاحبه.',
      en: 'This page demonstrates the editorial presentation format only. It does not represent an available property and does not show a price, owner, or address. Its purpose is to test Mihad’s private language before any real home is published with owner approval.',
    },
    highlights: [
      { ar: 'عرض بصري هادئ يركز على الشعور والمكانة', en: 'Calm visual presentation focused on feeling and status' },
      { ar: 'تفاصيل محدودة تحمي العنوان والمالك والسعر', en: 'Limited details protect address, owner, and price' },
      { ar: 'اهتمام جاد فقط بعد فحص مهاد للهوية والقدرة والنية', en: 'Serious interest only after Mihad screens identity, ability, and intent' },
    ],
    featureSummary: [
      { label: { ar: 'الظهور', en: 'Visibility' }, value: { ar: 'رابط خاص', en: 'Private link' } },
      { label: { ar: 'السعر', en: 'Price' }, value: { ar: 'غير منشور', en: 'Not public' } },
      { label: { ar: 'العنوان', en: 'Address' }, value: { ar: 'غير معروض', en: 'Not shown' } },
    ],
    privacyNotes: [
      { ar: 'لا توجد هوية مالك أو عنوان دقيق في الصفحة العامة.', en: 'No owner identity or exact address is shown publicly.' },
      { ar: 'أي اهتمام يمر عبر فحص مهاد قبل الوصول للمالك.', en: 'Any interest is screened by Mihad before reaching the owner.' },
      { ar: 'الصفحة ليست إعلان بيع ولا دعوة لتقديم عرض ملزم.', en: 'This page is not a sale advert or an invitation for a binding offer.' },
    ],
  },
];

export function publicProperties() {
  return privateProperties.filter((property) => property.visibility === 'public' && property.status === 'approved');
}

export function sitemapProperties() {
  return publicProperties();
}

export function findProperty(slug: string) {
  return privateProperties.find((property) => property.slug === slug) || null;
}

function text(value: unknown, max = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 'yes' || value === '1';
}

function phone(value: unknown) {
  return text(value, 60).replace(/[^\d+]/g, '');
}

export function makeReference(prefix: 'OWNER' | 'INTEREST') {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function buildDigestWhatsappUrl(input: { reference: string; path: 'owner' | 'interest'; phone?: string }) {
  const configured = text(process.env.NEXT_PUBLIC_MIHAD_WHATSAPP_URL || process.env.MIHAD_WHATSAPP_URL, 300);
  const base = configured || PRIVATE_DIGEST_WHATSAPP_URL;
  const message = `Mihad private digest ${input.path} reference ${input.reference}${input.phone ? `, phone ${input.phone}` : ''}.`;

  try {
    const url = new URL(base);
    if (url.hostname.includes('wa.me') || url.hostname.includes('whatsapp')) {
      url.searchParams.set('text', message);
    }
    return url.toString();
  } catch {
    return `${PRIVATE_DIGEST_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
  }
}

export function validateOwnerSubmission(value: unknown): ValidationResult<OwnerSubmission> {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const data: OwnerSubmission = {
    name: text(record.name, 160),
    phone: phone(record.phone),
    role: text(record.role, 160),
    city: text(record.city, 160),
    propertyType: text(record.propertyType, 160),
    privacyPreference: text(record.privacyPreference, 160),
    originalMediaReady: bool(record.originalMediaReady),
    consent: bool(record.consent),
    notes: text(record.notes, 1200),
  };
  const errors: Record<string, string> = {};
  if (!data.name) errors.name = 'Name is required.';
  if (!data.phone) errors.phone = 'Phone is required.';
  if (!data.role) errors.role = 'Owner or representative role is required.';
  if (!data.city) errors.city = 'City or area is required.';
  if (!data.propertyType) errors.propertyType = 'Property type is required.';
  if (!data.privacyPreference) errors.privacyPreference = 'Privacy preference is required.';
  if (!data.originalMediaReady) errors.originalMediaReady = 'Original media readiness must be confirmed.';
  if (!data.consent) errors.consent = 'Consent is required.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export function validatePrivateInterest(value: unknown): ValidationResult<PrivateInterest> {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const data: PrivateInterest = {
    propertySlug: text(record.propertySlug, 120),
    fullName: text(record.fullName, 160),
    phone: phone(record.phone),
    location: text(record.location, 160),
    intent: text(record.intent, 160),
    indicativeRange: text(record.indicativeRange, 160),
    fundingStatus: text(record.fundingStatus, 160),
    timeline: text(record.timeline, 160),
    proofReadiness: text(record.proofReadiness, 160),
    ndaOpen: bool(record.ndaOpen),
    consent: bool(record.consent),
    notes: text(record.notes, 1200),
  };
  const errors: Record<string, string> = {};
  if (!data.fullName) errors.fullName = 'Full name is required.';
  if (!data.phone) errors.phone = 'Phone is required.';
  if (!data.location) errors.location = 'City or country is required.';
  if (!data.intent) errors.intent = 'Intent is required.';
  if (!data.indicativeRange) errors.indicativeRange = 'Indicative range is required.';
  if (!data.fundingStatus) errors.fundingStatus = 'Funding status is required.';
  if (!data.timeline) errors.timeline = 'Timeline is required.';
  if (!data.proofReadiness) errors.proofReadiness = 'Proof readiness is required.';
  if (!data.ndaOpen) errors.ndaOpen = 'NDA openness must be confirmed.';
  if (!data.consent) errors.consent = 'Consent is required.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
