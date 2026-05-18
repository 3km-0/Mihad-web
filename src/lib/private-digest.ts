export type LocaleCode = 'ar' | 'en';

export type SpaceVisibility = 'public' | 'private_link';
export type SpaceStatus = 'approved' | 'editorial_preview';

export type EditorialSpace = {
  slug: string;
  title: { ar: string; en: string };
  locationHint: { ar: string; en: string };
  typology: { ar: string; en: string };
  visibility: SpaceVisibility;
  status: SpaceStatus;
  heroImage: string;
  galleryImages: string[];
  story: { ar: string; en: string };
  highlights: Array<{ ar: string; en: string }>;
  designNotes: Array<{ label: { ar: string; en: string }; value: { ar: string; en: string } }>;
  editorialNotes: Array<{ ar: string; en: string }>;
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

export type SpaceOffer = {
  spaceSlug: string;
  name: string;
  contact: string;
  message: string;
};

export function localize(locale: string, ar: string, en: string) {
  return locale === 'ar' ? ar : en;
}

export function localizedValue(locale: string, value: { ar: string; en: string }) {
  return localize(locale, value.ar, value.en);
}

export const PRIVATE_DIGEST_WHATSAPP_URL = 'https://wa.me/966500000000';

export const editorialSpaces: EditorialSpace[] = [
  {
    slug: 'editorial-format-preview',
    title: {
      ar: 'فيلا الضوء الهادئ',
      en: 'Quiet Light Villa',
    },
    locationHint: {
      ar: 'الرياض - دراسة بصرية',
      en: 'Riyadh - visual study',
    },
    typology: {
      ar: 'فيلا معاصرة ومجلس داخلي',
      en: 'Contemporary villa and interior majlis',
    },
    visibility: 'private_link',
    status: 'editorial_preview',
    heroImage: '/onboarding/launch.jpg',
    galleryImages: ['/onboarding/launch.jpg', '/onboarding/budget.jpg', '/onboarding/trial.jpg', '/onboarding/readiness.jpg'],
    story: {
      ar: 'واجهة ليلية بهندسة حادة وخشب دافئ، تفتح على داخل هادئ يصلح لاستقبال طويل وإيقاع عائلي خاص. القيمة هنا في الظل، خط السقف، عمق الفتحات، وكيف تتحول الإضاءة إلى جزء من التكوين.',
      en: 'A night facade with crisp geometry and warm timber, opening into a calm interior made for long hosting and private family rhythm. The focus is shade, roofline, recessed openings, and lighting as part of the composition.',
    },
    highlights: [
      { ar: 'مدخل مضاء بإيقاع هادئ لا يرفع صوته', en: 'A lit arrival with a calm, measured rhythm' },
      { ar: 'خشب داكن وحجر بارد يوازنان الواجهة', en: 'Dark timber and cool stone balance the facade' },
      { ar: 'خصوصية واضحة دون إغلاق المشهد بالكامل', en: 'Clear privacy without closing the view completely' },
    ],
    designNotes: [
      { label: { ar: 'الحضور', en: 'Presence' }, value: { ar: 'ليلي وهادئ', en: 'Evening and calm' } },
      { label: { ar: 'المواد', en: 'Materials' }, value: { ar: 'حجر، خشب، زجاج', en: 'Stone, timber, glass' } },
      { label: { ar: 'المزاج', en: 'Mood' }, value: { ar: 'رسمي ودافئ', en: 'Formal and warm' } },
    ],
    editorialNotes: [
      { ar: 'الواجهة تقرأ كصورة وصول: ضوء، ظل، ثم باب خشبي واضح.', en: 'The facade reads as an arrival scene: light, shadow, then a clear timber door.' },
      { ar: 'الإضاءة الخطية مستخدمة كحد معماري لا كزخرفة منفصلة.', en: 'Linear lighting works as an architectural edge, not separate decoration.' },
      { ar: 'الداخل يوحي بمجلس دافئ من غير كشف زائد.', en: 'The interior suggests a warm majlis without revealing too much.' },
    ],
  },
];

export function publicSpaces() {
  return editorialSpaces.filter((space) => space.visibility === 'public' && space.status === 'approved');
}

export function sitemapSpaces() {
  return publicSpaces();
}

export function findSpace(slug: string) {
  return editorialSpaces.find((space) => space.slug === slug) || null;
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

export function makeOfferReference() {
  return `OFFER-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
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

export function validateSpaceOffer(value: unknown): ValidationResult<SpaceOffer> {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  const data: SpaceOffer = {
    spaceSlug: text(record.spaceSlug, 120),
    name: text(record.name, 160),
    contact: text(record.contact, 180),
    message: text(record.message, 1200),
  };
  const errors: Record<string, string> = {};
  if (!data.spaceSlug) errors.spaceSlug = 'Space is required.';
  if (!data.message || data.message.length < 8) errors.message = 'Message is required.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
