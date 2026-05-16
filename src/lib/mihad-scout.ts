export type MihadGateState =
  | 'anonymous_preview'
  | 'needs_clarification'
  | 'ready_for_auth'
  | 'authenticated_search'
  | 'broker_ready';

export type MihadScoutIntent = {
  locale: 'en' | 'ar';
  raw_language: 'en' | 'ar';
  target_country_codes: Array<'SA' | 'AE' | 'TR'>;
  city: string[];
  districts: string[];
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  monthly_payment_max: number | null;
  currency: 'SAR' | 'AED' | 'TRY' | 'EUR' | 'USD';
  purpose: string | null;
  readiness: 'ready' | 'off_plan' | null;
  financing_posture: string | null;
  timeline: string | null;
  must_haves: string[];
  avoid: string[];
  confidence: number;
  missing_fields: string[];
};

export type MihadScoutTurn = {
  role: 'assistant' | 'user';
  text: string;
  intent_delta?: Partial<MihadScoutIntent>;
  next_question?: string | null;
  gate_state: MihadGateState;
};

export type MihadScoutPreviewCard = {
  title: string;
  location: string;
  note: string;
  preview_kind?: 'sample_preview' | 'live_preview';
};

export type MihadScoutIntentResponse = {
  request_id?: string;
  accepted?: boolean;
  model?: string;
  source?: string;
  intent: MihadScoutIntent;
  turn: MihadScoutTurn;
  preview_cards: MihadScoutPreviewCard[];
  preview_status?: {
    live_preview?: boolean;
    reason?: string | null;
    cached?: boolean;
    source?: string | null;
    adapter_runs?: Array<{
      source?: string;
      status?: string;
      cards_seen?: number;
      detail_pages_fetched?: number;
      candidates_created?: number;
      failure_count?: number;
    }>;
  };
};

export const MIHAD_SCOUT_INTENT_STORAGE_KEY = 'mihad_scout_intent_v1';

export function intentToOnboardingDraft(intent: MihadScoutIntent) {
  const country = intent.target_country_codes[0] || 'SA';
  const city = intent.city[0] || (country === 'AE' ? 'Dubai' : country === 'TR' ? 'Istanbul' : 'Riyadh');
  const budgetMax = intent.budget_max || null;
  const monthly = intent.monthly_payment_max || null;
  return {
    data: {
      city,
      targetCountries: intent.target_country_codes.length ? intent.target_country_codes : [country],
      assetType: intent.property_type || 'apartment',
      budgetMax: budgetMax ? String(Math.round(budgetMax)) : '',
      budgetMin: '',
      budgetCurrency: intent.currency || 'SAR',
      financing: monthly ? `Monthly payment under ${Math.round(monthly)} ${intent.currency || 'SAR'}` : '',
      timeline: intent.timeline === 'immediate'
        ? '30_days'
        : intent.timeline === '3_to_6_months'
          ? 'six_months'
          : '90_days',
      purpose: intent.purpose || 'family_use',
      liquidityClass: intent.financing_posture || 'needs_financing_guidance',
      districts: intent.districts.join(', '),
      workspaceName: `Mihad ${city} search`,
      mustHaves: intent.must_haves.join(', '),
      avoid: intent.avoid.join(', '),
    },
    step: 0,
    source: 'mihad_home_scout',
    savedAt: new Date().toISOString(),
  };
}
