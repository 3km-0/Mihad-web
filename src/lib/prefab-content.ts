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

export type FieldbookArticleType = 'use_case_guide' | 'model_breakdown' | 'supplier_story' | 'project_concept' | 'land_activation_idea';

export type FieldbookArticle = {
  slug: string;
  type: FieldbookArticleType;
  title: string;
  titleAr: string;
  dek: string;
  dekAr: string;
  image: string;
  categorySlug: string;
  modelHint: string;
  supplierHint: string;
  sizeRange: string;
  costRange: string;
  timeline: string;
  readinessChecklist: string[];
  sections: Array<{ heading: string; headingAr: string; body: string; bodyAr: string }>;
};

export const PREFAB_WHATSAPP_URL =
  'https://wa.me/966500000000?text=I%20want%20to%20start%20a%20Mihad%20activation%20request';

export const PREFAB_PROJECT_TYPES = [
  { value: 'commercial_site', label: 'Business prefab project', labelAr: 'مشروع تجاري جاهز' },
  { value: 'land_activation', label: 'Land activation', labelAr: 'تفعيل أرض' },
  { value: 'supplier_application', label: 'Modular supplier application', labelAr: 'تسجيل مورد مباني جاهزة' },
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
      { heading: 'How Mihad helps', body: 'Mihad starts with the calculator: land, budget, city, use case, and scope needs become a practical project brief before supplier comparison.' },
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
      { heading: 'Use Mihad calculator', body: 'A structured calculator brief helps suppliers respond to the same facts, which makes comparison easier.' },
    ],
    checklist: ['Unit specs', 'Delivery region', 'Timeline', 'Included scope', 'Excluded scope', 'Warranty', 'Payment terms'],
  },
];

export const FIELDBOOK_ARTICLES: FieldbookArticle[] = [
  {
    slug: 'roadside-retail-pod',
    type: 'use_case_guide',
    title: 'Roadside retail pod for a small commercial frontage',
    titleAr: 'كشك تجاري جاهز لواجهة طريق صغيرة',
    dek: 'A compact prefab concept for coffee, services, or quick retail where the site is visible and utilities are simple.',
    dekAr: 'فكرة مبنى جاهز صغير للقهوة أو الخدمات أو البيع السريع عندما تكون الواجهة واضحة والخدمات بسيطة.',
    image: '/onboarding/workspace.jpg',
    categorySlug: 'retail-kiosks',
    modelHint: '20-80 sqm retail kiosk or cafe pod',
    supplierHint: 'Suppliers with branding, counter, MEP, and installation scope',
    sizeRange: '20-80 sqm',
    costRange: '120k-420k SAR planning range',
    timeline: '6-12 weeks after quote and site readiness',
    readinessChecklist: ['Visible frontage', 'Electricity plan', 'Water/drainage if food service', 'Crane or truck access', 'Municipality use check'],
    sections: [
      { heading: 'Use case', headingAr: 'الاستخدام', body: 'This concept works when the business needs visibility more than a large footprint: coffee, phone repair, quick service, seasonal retail, or customer reception.', bodyAr: 'هذه الفكرة تناسب الأنشطة التي تحتاج واجهة واضحة أكثر من مساحة كبيرة: قهوة، صيانة جوالات، خدمة سريعة، بيع موسمي، أو استقبال عملاء.' },
      { heading: 'What drives cost', headingAr: 'ما الذي يغيّر التكلفة؟', body: 'Branding, wet services, counters, HVAC, transport, and installation scope matter more than the shell price alone.', bodyAr: 'الهوية، الخدمات الرطبة، الكاونترات، التكييف، النقل، ونطاق التركيب أهم من سعر الهيكل وحده.' },
      { heading: 'When Mihad helps', headingAr: 'متى يساعد مهاد؟', body: 'If the business has demand but no site, the calculator can capture the project brief first and land sourcing can happen later after signup.', bodyAr: 'إذا كانت الفكرة واضحة لكن الموقع غير موجود، تبدأ الحاسبة بموجز المشروع ثم يمكن فتح مساعدة الموقع بعد التسجيل.' },
    ],
  },
  {
    slug: 'construction-project-office',
    type: 'project_concept',
    title: 'Project office compound for construction teams',
    titleAr: 'مكاتب مواقع جاهزة لفرق المشاريع',
    dek: 'A modular office setup for contractors that need fast admin, meeting, and staff support space near a project.',
    dekAr: 'حل مكاتب جاهزة للمقاولين الذين يحتاجون إدارة واجتماعات ودعم فرق قريب من المشروع.',
    image: '/onboarding/launch.jpg',
    categorySlug: 'modular-offices',
    modelHint: '120-500 sqm office compound',
    supplierHint: 'Suppliers with lease terms, repeat delivery, MEP, and maintenance SLA',
    sizeRange: '120-500 sqm',
    costRange: '280k-1.4m SAR planning range or monthly lease option',
    timeline: '8-18 weeks depending on unit count',
    readinessChecklist: ['Project location', 'Lease duration', 'Power and water', 'Access road', 'Removal rights'],
    sections: [
      { heading: 'Use case', headingAr: 'الاستخدام', body: 'Project offices work best when duration, staff count, and site access are clear before supplier comparison.', bodyAr: 'مكاتب المواقع تكون أوضح عندما نعرف مدة المشروع، عدد الفريق، ووصول الموقع قبل مقارنة الموردين.' },
      { heading: 'Lease vs buy', headingAr: 'إيجار أم شراء؟', body: 'Short-term projects often need supplier lease terms and removal scope; longer projects may justify purchase or hybrid terms.', bodyAr: 'المشاريع القصيرة غالبًا تحتاج إيجارًا ونطاق إزالة واضحًا، بينما المشاريع الأطول قد تناسب الشراء أو نموذجًا هجينًا.' },
      { heading: 'What to estimate', headingAr: 'ماذا نحسب؟', body: 'The calculator should include office size, utilities, install/removal, maintenance reserve, and whether the land is already secured.', bodyAr: 'الحاسبة يجب أن تشمل مساحة المكتب، الخدمات، التركيب والإزالة، احتياطي الصيانة، وهل الموقع متوفر أم لا.' },
    ],
  },
  {
    slug: 'equipment-rental-yard-office',
    type: 'land_activation_idea',
    title: 'Equipment rental yard with a modular sales office',
    titleAr: 'ساحة تأجير معدات مع مكتب جاهز',
    dek: 'A land activation pattern where most value comes from yard access, frontage, and a small modular office.',
    dekAr: 'نمط تفعيل أرض يعتمد على الساحة والوصول والواجهة مع مكتب جاهز صغير.',
    image: '/onboarding/mandate.jpg',
    categorySlug: 'modular-offices',
    modelHint: '60-180 sqm office plus yard',
    supplierHint: 'Office suppliers plus land/site screening',
    sizeRange: '800-3000 sqm land, 60-180 sqm modular office',
    costRange: '160k-650k SAR office/site planning range',
    timeline: '8-16 weeks after land and rights are clear',
    readinessChecklist: ['Heavy vehicle access', 'Frontage/signage', 'Sublease rights', 'Surface condition', 'Removal rights'],
    sections: [
      { heading: 'Use case', headingAr: 'الاستخدام', body: 'This is not just a prefab unit. The economics depend on yard size, truck access, visibility, and whether the tenant can operate legally.', bodyAr: 'هذه ليست وحدة جاهزة فقط. الأرقام تعتمد على مساحة الساحة، دخول الشاحنات، الواجهة، وإمكانية تشغيل النشاط نظاميًا.' },
      { heading: 'What Mihad keeps subtle', headingAr: 'ما الذي يبقيه مهاد في الخلفية؟', body: 'The user can start with a calculator estimate. If land is missing, the activation engine can later search for suitable yards after authentication.', bodyAr: 'المستخدم يبدأ بتقدير الحاسبة. إذا كان الموقع مفقودًا، يمكن لمحرك مهاد البحث عن ساحات مناسبة لاحقًا بعد التسجيل.' },
      { heading: 'Risk checks', headingAr: 'فحوصات المخاطر', body: 'Sublease permission, removal rights, permit path, and fixed-cost coverage should be checked before operator-style risk is considered.', bodyAr: 'يجب فحص حق التأجير من الباطن، الإزالة، التصاريح، وتغطية التكاليف قبل التفكير في أي مخاطر تشغيلية.' },
    ],
  },
  {
    slug: 'prefab-majlis-extension',
    type: 'model_breakdown',
    title: 'Prefab majlis extension for a private plot',
    titleAr: 'مجلس جاهز كملحق في أرض خاصة',
    dek: 'A familiar residential use case where finishes, wet areas, and site access shape the final supplier quote.',
    dekAr: 'استخدام سكني مألوف تتأثر تكلفته بالتشطيب ودورات المياه والوصول للموقع.',
    image: '/onboarding/profile.jpg',
    categorySlug: 'majlis',
    modelHint: '40-120 sqm majlis or guest annex',
    supplierHint: 'Suppliers with finish options and wet-area clarity',
    sizeRange: '40-120 sqm',
    costRange: '140k-520k SAR planning range',
    timeline: '6-14 weeks after supplier quote',
    readinessChecklist: ['Plot access', 'Foundation scope', 'Bathroom/kitchen needs', 'Facade preference', 'Utility connection'],
    sections: [
      { heading: 'Use case', headingAr: 'الاستخدام', body: 'A majlis extension is simple only when the buyer knows whether foundation, utilities, and wet areas are included.', bodyAr: 'المجلس الجاهز يبدو بسيطًا فقط عندما يكون واضحًا هل الأساسات والخدمات ودورات المياه داخلة أم لا.' },
      { heading: 'What to compare', headingAr: 'ماذا تقارن؟', body: 'Compare suppliers by total scope, not just unit price: finishes, transport, installation, warranty, and exclusions.', bodyAr: 'قارن الموردين حسب النطاق الكامل، وليس سعر الوحدة فقط: التشطيب، النقل، التركيب، الضمان، والاستثناءات.' },
      { heading: 'Calculator fit', headingAr: 'ملاءمة الحاسبة', body: 'This is a strong public calculator entry point because the user can estimate privately before asking suppliers for quotes.', bodyAr: 'هذا مدخل مناسب للحاسبة لأن المستخدم يستطيع تقدير الفكرة أولًا قبل طلب عروض من الموردين.' },
    ],
  },
  {
    slug: 'supplier-factory-story',
    type: 'supplier_story',
    title: 'What a strong prefab supplier profile should show',
    titleAr: 'وش لازم يوضح ملف مورد المباني الجاهزة؟',
    dek: 'A buyer-friendly article explaining supplier identity, regions, warranty, model scope, response quality, and quote evidence.',
    dekAr: 'مقالة مبسطة توضح هوية المورد والمناطق والضمان ونطاق النماذج وجودة الرد والأدلة.',
    image: '/onboarding/readiness.jpg',
    categorySlug: 'prefab-homes',
    modelHint: 'Any prefab model with clear included/excluded scope',
    supplierHint: 'Verified supplier profile with regions, warranty, and SLA',
    sizeRange: 'Depends on selected model',
    costRange: 'Depends on supplier scope',
    timeline: 'Quote-dependent',
    readinessChecklist: ['Factory identity', 'Regions served', 'Included/excluded scope', 'Warranty terms', 'Response SLA'],
    sections: [
      { heading: 'Use case', headingAr: 'الاستخدام', body: 'Supplier stories should educate users without becoming paid puff pieces. The goal is to make quote comparison easier.', bodyAr: 'قصص الموردين يجب أن تثقف المستخدم بدون أن تتحول إلى دعاية فارغة. الهدف تسهيل مقارنة العروض.' },
      { heading: 'Trust signals', headingAr: 'إشارات الثقة', body: 'Useful profiles show identity, service regions, delivery assumptions, warranty, maintenance, and whether lease terms exist.', bodyAr: 'الملف المفيد يوضح الهوية، مناطق الخدمة، افتراضات التسليم، الضمان، الصيانة، وهل يوجد خيار إيجار.' },
      { heading: 'Calculator link', headingAr: 'صلة الحاسبة', body: 'The calculator turns inspiration into a structured brief that suppliers can respond to consistently.', bodyAr: 'الحاسبة تحول الإلهام إلى موجز منظم يستطيع الموردون الرد عليه بشكل قابل للمقارنة.' },
    ],
  },
];

export function getCategoryPage(slug: string) {
  return PREFAB_CATEGORIES.find((category) => category.slug === slug) || null;
}

export function getGuidePage(slug: string) {
  return PREFAB_GUIDES.find((guide) => guide.slug === slug) || null;
}

export function getFieldbookArticle(slug: string) {
  return FIELDBOOK_ARTICLES.find((article) => article.slug === slug) || null;
}

export function projectTypeLabel(value: string) {
  return PREFAB_PROJECT_TYPES.find((type) => type.value === value)?.label || value;
}
