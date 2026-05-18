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
      ar: 'معاينة مساحة تحريرية',
      en: 'Editorial space preview',
    },
    locationHint: {
      ar: 'المكان محفوظ للتنسيق البصري',
      en: 'Place withheld for visual study',
    },
    typology: {
      ar: 'عمارة داخلية معاصرة',
      en: 'Contemporary interior architecture',
    },
    visibility: 'private_link',
    status: 'editorial_preview',
    heroImage: '/private-digest/interior-study.png',
    galleryImages: ['/private-digest/interior-study.png'],
    story: {
      ar: 'هذه الصفحة توضّح شكل مهاد التحريري: قراءة هادئة لمساحة، ضوء، مادة، وتفاصيل معمارية. لا تهتم الصفحة بالمعاملة، بل بطريقة حضور المكان وهدوء قراءته.',
      en: 'This page demonstrates Mihad’s editorial format: a quiet reading of space, light, material, and architectural detail. It is concerned with how a place holds presence, not with transaction language.',
    },
    highlights: [
      { ar: 'ضوء طبيعي يحدد الإيقاع بدل الزخرفة', en: 'Natural light sets rhythm instead of decoration' },
      { ar: 'مواد هادئة تسمح للتفاصيل أن تظهر ببطء', en: 'Quiet materials let detail emerge slowly' },
      { ar: 'تكوين بصري يوازن بين الخصوصية والانفتاح', en: 'A visual composition balanced between privacy and openness' },
    ],
    designNotes: [
      { label: { ar: 'الضوء', en: 'Light' }, value: { ar: 'ناعم وممتد', en: 'Soft and extended' } },
      { label: { ar: 'المواد', en: 'Materials' }, value: { ar: 'خشب، حجر، نسيج', en: 'Wood, stone, textile' } },
      { label: { ar: 'الإيقاع', en: 'Rhythm' }, value: { ar: 'هادئ ومقروء', en: 'Calm and legible' } },
    ],
    editorialNotes: [
      { ar: 'الصفحة تستخدم نصًا مختصرًا حتى تبقى الصورة والمساحة في المقدمة.', en: 'The page uses spare copy so the image and space stay primary.' },
      { ar: 'التفاصيل العملية تبقى خارج العرض التحريري.', en: 'Operational details stay outside the editorial presentation.' },
      { ar: 'أي تواصل لاحق يتم يدويًا وبهدوء من فريق مهاد.', en: 'Any later follow-up is handled manually and quietly by Mihad.' },
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
