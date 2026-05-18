import type { Locale } from '@/i18n/request';

export type PrefabCopyLocale = Locale;

export function isArabic(locale: string): locale is 'ar' {
  return locale === 'ar';
}

export function pickLocalized(locale: string, ar: string, en: string) {
  return isArabic(locale) ? ar : en;
}

export const prefabCopy = {
  nav: {
    explore: { ar: 'استكشف البناء الجاهز', en: 'Explore Prefab' },
    suppliers: { ar: 'الموردون', en: 'Suppliers' },
    models: { ar: 'النماذج', en: 'Models' },
    guides: { ar: 'الأدلة', en: 'Guides' },
    businesses: { ar: 'للشركات', en: 'For Businesses' },
    manufacturers: { ar: 'للمصنعين', en: 'For Manufacturers' },
    signIn: { ar: 'تسجيل الدخول', en: 'Sign in' },
    getMatched: { ar: 'ابدأ تفويض موقع', en: 'Start a site mandate' },
    whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
    request: { ar: 'طلب', en: 'Request' },
  },
  rfq: {
    steps: {
      ar: ['من أنت؟', 'الموقع', 'المتطلبات', 'الأرقام', 'الحقوق والنواقص', 'التواصل'],
      en: ['Your path', 'Location', 'Requirements', 'Economics', 'Rights and gaps', 'Contact'],
    },
    headerEyebrow: { ar: 'طلب تفعيل موقع أو أرض', en: 'Site and land activation request' },
    headerTitle: { ar: 'خلّنا نفهم الطلب ونختار المسار الصحيح.', en: 'Tell us what you need so we can route it well.' },
    successTitle: { ar: 'وصلنا طلبك.', en: 'Your request has been received.' },
    successBody: {
      ar: 'فريق مهاد بيراجع الطلب، النواقص، والأرقام قبل أي تواصل مع مورد أو مالك أرض.',
      en: 'Mihad will review the request, gaps, and economics before any supplier or landowner outreach.',
    },
    reference: { ar: 'رقم الطلب', en: 'Request reference' },
    continueWhatsapp: { ar: 'كمل على واتساب', en: 'Continue on WhatsApp' },
    browseModels: { ar: 'تصفح النماذج', en: 'Browse models' },
    city: { ar: 'المدينة / موقع التسليم', en: 'City / delivery location' },
    cityPlaceholder: { ar: 'الرياض', en: 'Riyadh' },
    ownLand: { ar: 'هل الأرض موجودة؟', en: 'Do you own land?' },
    targetSize: { ar: 'المساحة التقريبية', en: 'Target size' },
    targetSizePlaceholder: { ar: '180 م²', en: '180 sqm' },
    rooms: { ar: 'الغرف / المتطلبات الداخلية', en: 'Rooms / bedrooms' },
    roomsPlaceholder: { ar: '3 غرف نوم، 4 دورات مياه', en: '3 bedrooms, 4 bathrooms' },
    useCase: { ar: 'الاستخدام', en: 'Use case' },
    useCasePlaceholder: { ar: 'فيلا عائلية، شاليه مزرعة، مكتب موقع...', en: 'Family villa, farm chalet, site office...' },
    style: { ar: 'الستايل المفضل', en: 'Preferred style' },
    stylePlaceholder: { ar: 'مودرن، تراثي، كابن بسيط...', en: 'Modern, traditional, simple cabin...' },
    modelReference: { ar: 'نموذج أو مورد محدد', en: 'Model reference' },
    modelReferencePlaceholder: { ar: 'اختياري: اسم نموذج أو مورد', en: 'Optional model or supplier reference' },
    budgetMin: { ar: 'الحد الأدنى للميزانية', en: 'Minimum budget' },
    budgetMinPlaceholder: { ar: '500000 ريال', en: '500000 SAR' },
    budgetMax: { ar: 'الحد الأعلى للميزانية', en: 'Maximum budget' },
    budgetMaxPlaceholder: { ar: '1200000 ريال', en: '1200000 SAR' },
    timeline: { ar: 'متى تحتاج التسليم؟', en: 'Desired timeline' },
    timelinePlaceholder: { ar: 'خلال 3 أشهر، الربع الرابع 2026...', en: 'Within 3 months, Q4 2026...' },
    scopeHelp: { ar: 'وش تحتاج من المورد أو الشركاء؟', en: 'Where do you need help?' },
    name: { ar: 'الاسم', en: 'Name' },
    namePlaceholder: { ar: 'اسمك', en: 'Your name' },
    phone: { ar: 'الجوال / واتساب', en: 'Phone / WhatsApp' },
    email: { ar: 'البريد الإلكتروني اختياري', en: 'Email optional' },
    whatsappPreferred: { ar: 'أفضل المتابعة على واتساب', en: 'Prefer WhatsApp follow-up' },
    notes: { ar: 'ملاحظات إضافية اختياري', en: 'Notes optional' },
    back: { ar: 'رجوع', en: 'Back' },
    continue: { ar: 'متابعة', en: 'Continue' },
    sending: { ar: 'جاري الإرسال...', en: 'Sending...' },
    send: { ar: 'إرسال الطلب', en: 'Send request' },
    fallbackError: { ar: 'تعذر إرسال الطلب الآن.', en: 'Unable to send request.' },
  },
} as const;
