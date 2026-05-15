// Country guides for Mihad MVP markets.
//
// IMPORTANT: this file is the single source of truth for buyer-facing
// guidance about each market. EVERY numeric threshold, tax rate,
// residency programme, and legal requirement here MUST be verified by
// the legal/operations team against an authoritative source before
// production launch. Each entry carries a `lastVerifiedAt` timestamp and
// `operatorReviewRequired` markers; do not surface unverified content
// in product without sign-off.
//
// Citation policy:
// - Prefer official ministry/regulator sources (Land Department, tax
//   authority, immigration ministry).
// - Capture the source URL and the date it was last consulted.
// - Treat anything older than 12 months as stale and re-verify.

export type CountryGuideSection = {
  id: string;
  heading: string;
  body: string[];
  operatorReviewRequired?: boolean;
  citations?: Array<{ label: string; url: string }>;
};

export type CountryGuide = {
  countryCode: 'AE' | 'TR' | 'GR' | 'ES' | 'SA';
  displayName: string;
  oneLineSummary: string;
  marketContext: string;
  sections: CountryGuideSection[];
  saudiComplianceNotes: string[];
  lastVerifiedAt: string | null;
  operatorReviewRequired: boolean;
};

const PENDING_VERIFICATION = 'OPERATOR_REVIEW_REQUIRED — please verify this threshold against the cited authority before exposing to buyers.';

export const COUNTRY_GUIDES: Record<CountryGuide['countryCode'], CountryGuide> = {
  AE: {
    countryCode: 'AE',
    displayName: 'United Arab Emirates',
    oneLineSummary: 'Freehold property in designated zones is open to foreign buyers; the Dubai Land Department and Abu Dhabi DMT govern transfers.',
    marketContext:
      'The UAE is a mature cross-border market for Saudi buyers, with deep secondary inventory in Dubai (Downtown, Marina, Palm Jumeirah, JVC, Business Bay) and Abu Dhabi (Saadiyat, Yas, Al Reem). Foreigners may own freehold in designated areas; leasehold and usufruct apply elsewhere. Off-plan purchases route through escrow accounts regulated by RERA.',
    sections: [
      {
        id: 'ownership_paths',
        heading: 'Ownership paths for non-residents',
        body: [
          'Foreigners can own freehold in designated areas of Dubai and Abu Dhabi. Outside those zones, leasehold (up to 99 years) or usufruct rights apply.',
          'Title is registered with the Dubai Land Department (Dubai) or the Abu Dhabi Department of Municipalities and Transport (DMT).',
        ],
        citations: [
          { label: 'Dubai Land Department', url: 'https://dubailand.gov.ae/' },
          { label: 'Abu Dhabi DMT', url: 'https://www.dmt.gov.ae/' },
        ],
      },
      {
        id: 'residency_pathways',
        heading: 'Property-linked residency pathways',
        body: [
          'Property investment can qualify buyers for renewable UAE residency under specific programmes. The exact value thresholds and conditions vary by emirate and visa category.',
          `Specific minimum-value thresholds for the property investor residency and the Golden Visa real-estate route: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
        citations: [
          { label: 'ICP (Federal Authority for Identity, Citizenship, Customs & Port Security)', url: 'https://icp.gov.ae/' },
          { label: 'Dubai Land Department — Golden Visa', url: 'https://dubailand.gov.ae/en/' },
        ],
      },
      {
        id: 'transaction_costs',
        heading: 'Indicative transaction costs',
        body: [
          'Dubai: title transfer fees, trustee office fees, mortgage registration (if applicable), Oqood fee on off-plan.',
          'Abu Dhabi: title transfer fees and mortgage registration.',
          `Specific percentage rates and fixed fees: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
        citations: [
          { label: 'Dubai Land Department — fees', url: 'https://dubailand.gov.ae/en/services/' },
        ],
      },
      {
        id: 'due_diligence',
        heading: 'Due-diligence checklist',
        body: [
          'Confirm the property is in a designated freehold area for non-GCC buyers (or apply the correct leasehold structure).',
          'Verify the title deed and any encumbrances at the DLD/DMT registry of record.',
          'For off-plan: confirm the project is registered with RERA and the developer escrow account is active.',
          'Confirm the seller is the registered owner; require Power of Attorney if the seller is acting through an agent.',
          'Obtain a Service Charge statement and verify there are no outstanding community fees.',
        ],
      },
    ],
    saudiComplianceNotes: [
      'Outbound transfers from KSA must comply with SAMA reporting thresholds; document the source-of-funds trail end-to-end.',
      'Property held abroad remains a reportable asset under applicable KSA disclosure regimes; consult a licensed tax advisor.',
      'PDPL (Saudi Personal Data Protection Law) governs any personal data shared with UAE brokers via Mihad. Mihad ships only derived readiness signals — never raw documents — without explicit per-broker consent.',
    ],
    lastVerifiedAt: null,
    operatorReviewRequired: true,
  },
  TR: {
    countryCode: 'TR',
    displayName: 'Türkiye',
    oneLineSummary: 'Foreigners can own most real estate, subject to military clearance; a Citizenship-by-Investment programme exists at a defined minimum value.',
    marketContext:
      'Türkiye is a deep cross-border market with strong demand from MENA buyers in Istanbul (Asian and European sides), Bodrum, Antalya, and Bursa. Most property categories are open to foreigners with reciprocity; military-clearance review applies before the title transfer (Tapu). Currency volatility (TRY/SAR) is a meaningful variable in underwriting.',
    sections: [
      {
        id: 'ownership_paths',
        heading: 'Ownership paths for non-residents',
        body: [
          'Foreigners may own real estate up to a per-country acreage cap and within reciprocity rules. Military clearance is required before the Tapu (title deed) is issued.',
          'Properties are registered at the Tapu Müdürlüğü (Land Registry Directorate).',
        ],
        citations: [
          { label: 'Tapu ve Kadastro Genel Müdürlüğü', url: 'https://www.tkgm.gov.tr/' },
        ],
      },
      {
        id: 'residency_pathways',
        heading: 'Property-linked residency and citizenship',
        body: [
          'Türkiye offers a Citizenship-by-Investment route via real-estate purchase, subject to a minimum value and a hold period.',
          `Current minimum value, hold period, and any per-buyer property-count restrictions: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
        citations: [
          { label: 'Presidency of Migration Management', url: 'https://www.goc.gov.tr/' },
          { label: 'Investment Office of the Presidency of Türkiye', url: 'https://www.invest.gov.tr/' },
        ],
      },
      {
        id: 'transaction_costs',
        heading: 'Indicative transaction costs',
        body: [
          'Tapu (title) fee, notary fees, valuation report (mandatory for foreign-buyer transactions), and any agency commission.',
          `Specific percentage rates and indicative valuation-report cost: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
      },
      {
        id: 'due_diligence',
        heading: 'Due-diligence checklist',
        body: [
          'Obtain an independent SPK-licensed valuation report (mandatory for foreign buyers and for the CBI programme).',
          'Verify the property is unencumbered at the Tapu registry.',
          'Confirm military-clearance approval is in process or already on file.',
          'For CBI: confirm the buyer commits to the required hold period and that the seller is not a related party (to avoid CBI ineligibility).',
          'Account for TRY/SAR currency risk: the price in TRY at signing may diverge materially from the SAR equivalent at registration if there is a gap.',
        ],
      },
    ],
    saudiComplianceNotes: [
      'Outbound transfers to Türkiye must clear SAMA reporting and the recipient bank account should be in the buyer\'s name (avoid third-party routing).',
      'CBI applicants must declare the new nationality where required by KSA regulations; obtain qualified legal counsel before applying.',
      'PDPL applies to any personal data shared with Turkish brokers via Mihad.',
    ],
    lastVerifiedAt: null,
    operatorReviewRequired: true,
  },
  GR: {
    countryCode: 'GR',
    displayName: 'Greece',
    oneLineSummary: 'Greece operates a residency-by-investment ("Golden Visa") tied to property purchase, with values that vary by location.',
    marketContext:
      'Greece is an established EU market with concentration in Attica (Athens metro), Thessaloniki, and the Cycladic islands. Property is registered through Land Registries and the National Cadastre. The Greek Golden Visa is one of the EU\'s longest-running residency-by-investment programmes; thresholds have been revised multiple times and now vary by region.',
    sections: [
      {
        id: 'ownership_paths',
        heading: 'Ownership paths for non-residents',
        body: [
          'Non-EU citizens may purchase property in most regions; some border-zone restrictions apply and require special clearance.',
          'Transactions are notarised and registered at the Land Registry / National Cadastre.',
        ],
        citations: [
          { label: 'Ktimatologio (National Cadastre)', url: 'https://www.ktimatologio.gr/' },
        ],
      },
      {
        id: 'residency_pathways',
        heading: 'Property-linked residency (Golden Visa)',
        body: [
          'The Greek Golden Visa grants renewable residency in exchange for qualifying real-estate investment. The minimum-investment threshold varies by location (higher in Athens, Thessaloniki, Mykonos, and Santorini; lower elsewhere).',
          `Current per-region minimum-investment thresholds and any single-property minimum size rules: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
        citations: [
          { label: 'Enterprise Greece — Golden Visa', url: 'https://www.enterprisegreece.gov.gr/' },
          { label: 'Ministry of Migration & Asylum', url: 'https://migration.gov.gr/' },
        ],
      },
      {
        id: 'transaction_costs',
        heading: 'Indicative transaction costs',
        body: [
          'Property transfer tax or VAT (depending on whether it is a first sale of a new build), notary fees, lawyer fees, land registry fees, and agency commission.',
          `Specific rates: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
      },
      {
        id: 'due_diligence',
        heading: 'Due-diligence checklist',
        body: [
          'Obtain an AFM (Greek tax number) for the buyer.',
          'Engage a Greek lawyer to conduct title and encumbrance search at the Land Registry / Cadastre.',
          'Verify planning permissions and that any construction is legal and registered (semi-legal extensions are common).',
          'Confirm there are no outstanding common-area or municipal taxes.',
          'For Golden Visa applications: confirm the property type, location, and purchase price meet the current programme rules at the moment of application.',
        ],
      },
    ],
    saudiComplianceNotes: [
      'Outbound transfers to Greece must comply with SAMA reporting. Greek banks typically require additional source-of-funds documentation for non-EU buyers.',
      'Greek tax residency consequences are independent of the Golden Visa; consult a tax advisor about potential reporting obligations in KSA.',
      'PDPL applies to data shared with Greek brokers via Mihad.',
    ],
    lastVerifiedAt: null,
    operatorReviewRequired: true,
  },
  ES: {
    countryCode: 'ES',
    displayName: 'Spain',
    oneLineSummary: 'Spain is fully open to foreign buyers; the historic Golden Visa programme has been wound down — verify the current residency pathway.',
    marketContext:
      'Spain is a deep EU market with concentration in Madrid, Barcelona, Costa del Sol (Marbella, Estepona), Valencia, the Balearics, and the Canaries. The Land Registry (Registro de la Propiedad) records titles; transfers are notarised. The Spanish "Golden Visa" residency-by-investment route was historically tied to a EUR 500,000 property purchase; operators should verify the programme\'s current status before quoting it to buyers.',
    sections: [
      {
        id: 'ownership_paths',
        heading: 'Ownership paths for non-residents',
        body: [
          'There are no nationality-based restrictions on residential property ownership; foreigners may hold full freehold title.',
          'Transactions are signed before a notary and registered at the Registro de la Propiedad.',
        ],
        citations: [
          { label: 'Colegio de Registradores de España', url: 'https://www.registradores.org/' },
        ],
      },
      {
        id: 'residency_pathways',
        heading: 'Property-linked residency',
        body: [
          `Status of the Spanish residency-by-investment ("Golden Visa") programme and any successor framework: ${PENDING_VERIFICATION}`,
          'Other residency routes — non-lucrative visa, digital nomad visa — exist independent of property ownership and have their own income/asset thresholds.',
        ],
        operatorReviewRequired: true,
        citations: [
          { label: 'Ministerio de Asuntos Exteriores, Unión Europea y Cooperación', url: 'https://www.exteriores.gob.es/' },
        ],
      },
      {
        id: 'transaction_costs',
        heading: 'Indicative transaction costs',
        body: [
          'Resale: Impuesto sobre Transmisiones Patrimoniales (ITP, varies by autonomous community).',
          'New build: IVA (VAT) plus AJD (Actos Jurídicos Documentados).',
          'Notary fees, Land Registry fees, lawyer fees, and any agency commission.',
          `Specific rates per autonomous community: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
      },
      {
        id: 'due_diligence',
        heading: 'Due-diligence checklist',
        body: [
          'Obtain a NIE (Número de Identificación de Extranjero) for the buyer — required to sign and register.',
          'Engage a Spanish abogado to conduct Nota Simple from the Land Registry: confirms ownership, encumbrances, and charges.',
          'Verify the property is up to date on IBI (municipal property tax) and community fees.',
          'Confirm certificate of habitability (Cédula de Habitabilidad) and energy performance certificate (Certificado de Eficiencia Energética).',
          'For new builds: confirm a "first occupancy licence" (Licencia de Primera Ocupación) is in place.',
        ],
      },
    ],
    saudiComplianceNotes: [
      'Outbound transfers to Spain must comply with SAMA reporting; Spanish banks may require an additional Modelo S-1 declaration on the receiving side for transfers over a regulatory threshold.',
      'Spanish wealth tax and Impuesto sobre Patrimonio thresholds apply to non-residents holding Spanish property; consult a tax advisor.',
      'PDPL applies to data shared with Spanish brokers via Mihad. GDPR also applies on the Spanish side.',
    ],
    lastVerifiedAt: null,
    operatorReviewRequired: true,
  },
  SA: {
    countryCode: 'SA',
    displayName: 'Saudi Arabia',
    oneLineSummary: 'Saudi Arabia is Mihad\'s home market — investor-cockpit workspaces use the full acquisition pipeline including Aqar and Bayut sourcing.',
    marketContext:
      'Saudi Arabia is Mihad\'s domestic market. Domestic acquisitions use the full Zohal acquisition cockpit (Aqar and Bayut sourcing, Riyadh district intelligence, Saudi-specific underwriting). Cross-border buyers targeting Saudi from outside KSA can use Property Finder Saudi as an additional source.',
    sections: [
      {
        id: 'domestic_flow',
        heading: 'Domestic acquisition flow',
        body: [
          'Saudi buyers searching domestically use the investor cockpit workspace (overview, underwriting, evidence ladder, deal desk) rather than the Mihad buyer-desk view.',
          'Riyadh-specific district maps, renovation rate cards, and capex calculators are tuned for the domestic flip and rent-hold strategies.',
        ],
      },
      {
        id: 'cross_border_inbound',
        heading: 'Cross-border buyers targeting Saudi',
        body: [
          'Non-Saudi buyers acquiring Saudi property face additional regulatory steps depending on their nationality and the property type. GCC nationals have broader access than non-GCC.',
          `Specific non-GCC ownership rules and any permit requirements: ${PENDING_VERIFICATION}`,
        ],
        operatorReviewRequired: true,
        citations: [
          { label: 'Real Estate General Authority (REGA)', url: 'https://rega.gov.sa/' },
        ],
      },
    ],
    saudiComplianceNotes: [
      'Domestic transactions are governed by SAMA, REGA, and ZATCA.',
      'PDPL applies to all personal data; raw documents are stored only with explicit buyer consent and short-TTL access controls.',
    ],
    lastVerifiedAt: null,
    operatorReviewRequired: true,
  },
};

export function getCountryGuide(code: string): CountryGuide | null {
  const normalized = String(code || '').toUpperCase();
  if (normalized in COUNTRY_GUIDES) {
    return COUNTRY_GUIDES[normalized as CountryGuide['countryCode']];
  }
  return null;
}

export const COUNTRY_GUIDE_CODES = Object.keys(COUNTRY_GUIDES) as CountryGuide['countryCode'][];
