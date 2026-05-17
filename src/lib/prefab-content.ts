export type PrefabCategory = {
  slug: string;
  title: string;
  titleAr: string;
  shortTitle: string;
  description: string;
  descriptionAr: string;
  tags: string[];
  modelTypes: string[];
  useCases: string[];
  image: string;
  costFactors: string[];
};

export type PrefabGuide = {
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  category: string;
  readMinutes: number;
  sections: Array<{ heading: string; body: string }>;
  checklist: string[];
};

export const PREFAB_WHATSAPP_URL =
  'https://wa.me/966500000000?text=I%20want%20to%20request%20a%20prefab%20quote%20through%20Mihad';

export const PREFAB_PROJECT_TYPES = [
  { value: 'villa', label: 'Home / Villa', labelAr: 'منزل / فيلا' },
  { value: 'chalet', label: 'Chalet / Cabin', labelAr: 'شاليه / كابن' },
  { value: 'majlis', label: 'Majlis', labelAr: 'مجلس' },
  { value: 'farmhouse', label: 'Farmhouse / Rest house', labelAr: 'استراحة / مزرعة' },
  { value: 'modular_office', label: 'Modular office', labelAr: 'مكتب جاهز' },
  { value: 'worker_housing', label: 'Staff housing', labelAr: 'سكن عمال' },
  { value: 'clinic_classroom', label: 'Clinic / Classroom', labelAr: 'عيادة / فصل' },
  { value: 'retail_kiosk', label: 'Retail kiosk / Cafe', labelAr: 'كشك / مقهى' },
] as const;

export const LAND_STATUS_OPTIONS = [
  { value: 'owned', label: 'Yes, I own land', labelAr: 'نعم، لدي أرض' },
  { value: 'identified', label: 'I found land but have not purchased', labelAr: 'وجدت أرضًا ولم أشترها بعد' },
  { value: 'needed', label: 'I need help checking land fit', labelAr: 'أحتاج مساعدة في جاهزية الأرض' },
  { value: 'unknown', label: 'Not sure yet', labelAr: 'لست متأكدًا' },
] as const;

export const SCOPE_NEEDS = [
  { value: 'transport', label: 'Transport', labelAr: 'النقل' },
  { value: 'foundation', label: 'Foundation', labelAr: 'الأساسات' },
  { value: 'utilities', label: 'Utilities', labelAr: 'الخدمات' },
  { value: 'installation', label: 'Installation', labelAr: 'التركيب' },
  { value: 'permit_guidance', label: 'Permit guidance', labelAr: 'إرشاد التصاريح' },
  { value: 'financing', label: 'Financing', labelAr: 'التمويل' },
  { value: 'not_sure', label: 'Not sure yet', labelAr: 'لست متأكدًا' },
] as const;

export const PREFAB_CATEGORIES: PrefabCategory[] = [
  {
    slug: 'prefab-homes',
    title: 'Prefab homes in Saudi Arabia',
    titleAr: 'منازل جاهزة في السعودية',
    shortTitle: 'Prefab Homes',
    description: 'Villas, family homes, annexes, and guest units for Saudi plots.',
    descriptionAr: 'فلل، منازل عائلية، ملاحق، ووحدات ضيافة مناسبة للأراضي السعودية.',
    tags: ['villa', 'family_home', 'annex'],
    modelTypes: ['modular_villa', 'villa'],
    useCases: ['family_home'],
    image: '/onboarding/mandate.jpg',
    costFactors: ['Size and finish level', 'Transport distance', 'Foundation scope', 'Utilities and MEP', 'Permit guidance'],
  },
  {
    slug: 'prefab-villas',
    title: 'Prefab villas',
    titleAr: 'فلل جاهزة',
    shortTitle: 'Prefab Villas',
    description: 'Larger modular homes with family layouts, private rooms, and fitout choices.',
    descriptionAr: 'حلول سكنية أكبر بتوزيع عائلي وخيارات تشطيب متعددة.',
    tags: ['villa', 'family_home'],
    modelTypes: ['modular_villa'],
    useCases: ['family_home'],
    image: '/onboarding/workspace.jpg',
    costFactors: ['Room count', 'Facade and materials', 'Kitchen and wet areas', 'Site access', 'Installation scope'],
  },
  {
    slug: 'chalets-cabins',
    title: 'Prefab chalets and cabins',
    titleAr: 'شاليهات وكبائن جاهزة',
    shortTitle: 'Chalets & Cabins',
    description: 'Compact units for farms, resorts, rest houses, and weekend stays.',
    descriptionAr: 'وحدات عملية للمزارع، المنتجعات، الاستراحات، والإقامات القصيرة.',
    tags: ['cabin', 'resort_unit', 'farmhouse'],
    modelTypes: ['cabin', 'resort_unit'],
    useCases: ['hospitality_or_family_annex', 'site_office_or_annex'],
    image: '/onboarding/readiness.jpg',
    costFactors: ['Insulation', 'Bathroom package', 'Transport route', 'Utility hookup', 'Outdoor works'],
  },
  {
    slug: 'majlis',
    title: 'Prefab majlis units',
    titleAr: 'مجالس جاهزة',
    shortTitle: 'Majlis Units',
    description: 'Guest rooms, outdoor majlis, and family extensions with clear included scope.',
    descriptionAr: 'مجالس ضيافة وملاحق عائلية مع توضيح ما يدخل في نطاق العرض.',
    tags: ['majlis', 'annex'],
    modelTypes: ['majlis', 'cabin'],
    useCases: ['family_home', 'site_office_or_annex'],
    image: '/onboarding/profile.jpg',
    costFactors: ['Interior finishes', 'Wet area needs', 'Facade customization', 'Foundation', 'Delivery access'],
  },
  {
    slug: 'farmhouses-rest-houses',
    title: 'Farmhouses and rest houses',
    titleAr: 'استراحات ومزارع جاهزة',
    shortTitle: 'Rest Houses',
    description: 'Practical prefab options for farms, weekend use, and rural plots.',
    descriptionAr: 'خيارات جاهزة عملية للمزارع والاستراحات والأراضي خارج المدن.',
    tags: ['farmhouse', 'resort_unit', 'cabin'],
    modelTypes: ['resort_unit', 'cabin'],
    useCases: ['hospitality_or_family_annex'],
    image: '/onboarding/budget.jpg',
    costFactors: ['Remote delivery', 'Utilities', 'Water/septic planning', 'Shade and landscaping', 'Security and access'],
  },
  {
    slug: 'modular-offices',
    title: 'Modular offices',
    titleAr: 'مكاتب جاهزة',
    shortTitle: 'Modular Offices',
    description: 'Site offices, admin units, and temporary business facilities.',
    descriptionAr: 'مكاتب مواقع ووحدات إدارية ومساحات عمل مؤقتة للمشاريع.',
    tags: ['site_office', 'modular_office'],
    modelTypes: ['cabin', 'site_office'],
    useCases: ['site_office_or_annex'],
    image: '/onboarding/launch.jpg',
    costFactors: ['Number of units', 'MEP requirements', 'Delivery window', 'Stacking/layout', 'Installation support'],
  },
  {
    slug: 'staff-housing',
    title: 'Staff housing modular units',
    titleAr: 'وحدات سكن عمال جاهزة',
    shortTitle: 'Staff Housing',
    description: 'Worker accommodation and site facilities for repeat procurement needs.',
    descriptionAr: 'سكن عمال ومرافق مواقع للمشاريع التي تحتاج توريدًا متكررًا.',
    tags: ['worker_housing', 'site_facility'],
    modelTypes: ['cabin', 'worker_housing'],
    useCases: ['site_office_or_annex'],
    image: '/onboarding/phone.jpg',
    costFactors: ['Capacity per unit', 'Bathroom ratio', 'Fire and safety requirements', 'Utilities', 'Maintenance scope'],
  },
  {
    slug: 'clinics-classrooms',
    title: 'Modular clinics and classrooms',
    titleAr: 'عيادات وفصول جاهزة',
    shortTitle: 'Clinics & Classrooms',
    description: 'Healthcare and education units where compliance and fitout scope matter.',
    descriptionAr: 'وحدات صحية وتعليمية تحتاج وضوحًا في المواصفات والاشتراطات.',
    tags: ['clinic', 'classroom', 'education'],
    modelTypes: ['modular_clinic', 'classroom'],
    useCases: ['business_facility'],
    image: '/onboarding/trial.jpg',
    costFactors: ['Specialized fitout', 'HVAC', 'Accessibility', 'Authority requirements', 'Utilities'],
  },
  {
    slug: 'retail-kiosks',
    title: 'Retail kiosks and cafes',
    titleAr: 'أكشاك ومقاهي جاهزة',
    shortTitle: 'Retail & Kiosks',
    description: 'Compact commercial units for cafes, booths, and quick retail spaces.',
    descriptionAr: 'وحدات تجارية صغيرة للمقاهي والأكشاك ونقاط البيع السريعة.',
    tags: ['retail_kiosk', 'cafe'],
    modelTypes: ['retail_kiosk', 'cabin'],
    useCases: ['business_facility'],
    image: '/onboarding/workspace.jpg',
    costFactors: ['Branding', 'Service counters', 'MEP', 'Transport and crane access', 'Authority requirements'],
  },
];

export const PREFAB_GUIDES: PrefabGuide[] = [
  {
    slug: 'prefab-home-cost-saudi-arabia',
    title: 'How much does a prefab home cost in Saudi Arabia?',
    titleAr: 'كم تكلفة المنزل الجاهز في السعودية؟',
    description: 'Understand why prefab pricing depends on size, scope, delivery, foundation, utilities, and finishes.',
    category: 'Cost and comparison',
    readMinutes: 5,
    sections: [
      { heading: 'The short answer', body: 'A reliable quote should separate factory fabrication from delivery, foundation, installation, utilities, and optional customization. Avoid comparing headline prices without scope.' },
      { heading: 'What changes the price', body: 'Size, wet areas, insulation, facade, transport route, site access, and finish level can materially change total project cost.' },
      { heading: 'How Mihad helps', body: 'Mihad asks for land, budget, city, use case, and scope needs before routing the RFQ to relevant suppliers.' },
    ],
    checklist: ['City and land location', 'Target size', 'Budget range', 'Included/excluded scope', 'Transport and installation assumptions'],
  },
  {
    slug: 'prefab-vs-traditional-construction',
    title: 'Prefab villa vs traditional construction',
    titleAr: 'الفيلا الجاهزة أم البناء التقليدي؟',
    description: 'Compare speed, customization, scope clarity, and site responsibilities before requesting quotes.',
    category: 'Cost and comparison',
    readMinutes: 4,
    sections: [
      { heading: 'What prefab can simplify', body: 'Prefab can reduce on-site work and make factory scope clearer, but site preparation and authority requirements still matter.' },
      { heading: 'Where buyers get surprised', body: 'The biggest confusion usually comes from foundation, utility connections, permits, and transport exclusions.' },
    ],
    checklist: ['Timeline target', 'Customization needs', 'Foundation status', 'Utility plan', 'Authority requirements'],
  },
  {
    slug: 'can-i-install-prefab-on-my-land',
    title: 'Can I install a prefab home on my land?',
    titleAr: 'هل يمكن تركيب مبنى جاهز على أرضي؟',
    description: 'Land readiness questions every buyer should answer before supplier matching.',
    category: 'Land readiness',
    readMinutes: 5,
    sections: [
      { heading: 'Start with land facts', body: 'The supplier needs to know city, access, utilities, soil/foundation assumptions, and any municipal constraints.' },
      { heading: 'Photos help', body: 'Site photos, map pin, sketches, or existing utility details can make early quote conversations more useful.' },
    ],
    checklist: ['Map location', 'Access road', 'Electricity and water', 'Foundation status', 'Site photos'],
  },
  {
    slug: 'choose-prefab-manufacturer',
    title: 'How to choose a prefab manufacturer',
    titleAr: 'كيف تختار مصنع بناء جاهز؟',
    description: 'Look beyond photos: compare factory identity, warranty, regions served, scope, and response quality.',
    category: 'Supplier trust',
    readMinutes: 6,
    sections: [
      { heading: 'Trust is more than a logo', body: 'Ask for company identity, project photos, service regions, warranty details, and what the supplier actually includes.' },
      { heading: 'Compare responses', body: 'A strong supplier response should clarify assumptions, exclusions, timeline, and site requirements.' },
    ],
    checklist: ['Factory location', 'Warranty information', 'Portfolio examples', 'Service regions', 'Included/excluded scope'],
  },
  {
    slug: 'foundations-utilities-prefab',
    title: 'Foundations and utilities explained',
    titleAr: 'شرح الأساسات والخدمات للمباني الجاهزة',
    description: 'Know who handles foundations, electricity, water, sewage, and site preparation.',
    category: 'Land readiness',
    readMinutes: 5,
    sections: [
      { heading: 'Scope must be explicit', body: 'Some suppliers include installation but not foundation or utility connections. Others coordinate more scope for turnkey projects.' },
      { heading: 'Ask before comparing', body: 'Quote comparisons are weak unless each supplier states what they include and exclude.' },
    ],
    checklist: ['Foundation included?', 'Utility connections included?', 'Transport included?', 'Crane/site access included?', 'Permit guidance included?'],
  },
  {
    slug: 'prefab-quote-comparison-checklist',
    title: 'Prefab quote comparison checklist',
    titleAr: 'قائمة مقارنة عروض البناء الجاهز',
    description: 'A practical checklist for comparing supplier offers without getting trapped by incomplete scope.',
    category: 'Supplier trust',
    readMinutes: 4,
    sections: [
      { heading: 'Compare total scope', body: 'Do not compare only the unit price. Compare delivery, installation, utilities, warranty, customization, and excluded costs.' },
      { heading: 'Use Mihad RFQ', body: 'A structured RFQ helps suppliers respond to the same facts, which makes comparison easier.' },
    ],
    checklist: ['Unit specs', 'Delivery region', 'Timeline', 'Included scope', 'Excluded scope', 'Warranty', 'Payment terms'],
  },
];

export function getCategoryPage(slug: string) {
  return PREFAB_CATEGORIES.find((category) => category.slug === slug) || null;
}

export function getGuidePage(slug: string) {
  return PREFAB_GUIDES.find((guide) => guide.slug === slug) || null;
}

export function projectTypeLabel(value: string) {
  return PREFAB_PROJECT_TYPES.find((type) => type.value === value)?.label || value;
}
