import { createChatCompletion, extractOutputText } from "../analysis/ai-provider.js";

const LAUNCH_COUNTRIES = new Set(["SA", "AE", "TR"]);
const PROPERTY_TYPES = new Set(["apartment", "villa", "townhouse", "land", "building", "commercial"]);

function cleanText(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .trim()
    .replace(/\s+/g, " ");
}

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(String(text || ""));
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function numberFromMatch(match) {
  const base = Number(String(match?.[1] || "").replace(/,/g, ""));
  if (!Number.isFinite(base)) return null;
  let unit = String(match?.[2] || "").toLowerCase();
  const nextChar = String(match?.input || "")[Number(match?.index || 0) + String(match?.[0] || "").length] || "";
  if (["m", "k"].includes(unit) && /[a-z]/i.test(nextChar)) unit = "";
  if (["m", "mn", "million", "mio", "مليون"].includes(unit)) return base * 1_000_000;
  if (["k", "thousand", "ألف", "الف", "آلاف", "الاف"].includes(unit)) return base * 1_000;
  return base;
}

function detectCurrency(text) {
  if (/\bAED\b|درهم|دبي/i.test(text)) return "AED";
  if (/\bTRY\b|ليرة|ترك/i.test(text)) return "TRY";
  if (/\bUSD\b|\$/i.test(text)) return "USD";
  if (/\bEUR\b|€|euro/i.test(text)) return "EUR";
  return "SAR";
}

function detectLocations(text) {
  const hits = [];
  const countryHits = [];
  const patterns = [
    { city: "Riyadh", code: "SA", re: /\briyadh\b|الرياض/i },
    { city: "Jeddah", code: "SA", re: /\bjeddah\b|جدة|جده/i },
    { city: "Dubai", code: "AE", re: /\bdubai\b|دبي/i },
    { city: "Abu Dhabi", code: "AE", re: /\babu\s*dhabi\b|أبوظبي|ابوظبي/i },
    { city: "Istanbul", code: "TR", re: /\bistanbul\b|اسطنبول|إسطنبول/i },
    { city: "Antalya", code: "TR", re: /\bantalya\b|أنطاليا|انطاليا/i },
    { city: "Bodrum", code: "TR", re: /\bbodrum\b|بودروم/i },
    { city: "Izmir", code: "TR", re: /\bizmir\b|إزمير|ازمير/i },
  ];
  for (const item of patterns) {
    if (item.re.test(text)) {
      hits.push(item.city);
      countryHits.push(item.code);
    }
  }
  if (/\b(saudi|ksa|saudi arabia)\b|السعودية|السعوديه/i.test(text)) countryHits.push("SA");
  if (/\buae\b|emirates|الإمارات|الامارات/i.test(text)) countryHits.push("AE");
  if (/\bturkey\b|türkiye|turkiye|تركيا/i.test(text)) countryHits.push("TR");
  return { cities: uniq(hits), countries: uniq(countryHits).filter((code) => LAUNCH_COUNTRIES.has(code)) };
}

function detectPropertyType(text) {
  if (/apartment|flat|شقة|شقه/i.test(text)) return "apartment";
  if (/villa|فيلا/i.test(text)) return "villa";
  if (/townhouse|تاون/i.test(text)) return "townhouse";
  if (/land|plot|أرض|ارض/i.test(text)) return "land";
  if (/building|عمارة|عماره|مبنى/i.test(text)) return "building";
  if (/commercial|office|retail|مكتب|تجاري/i.test(text)) return "commercial";
  return null;
}

function detectPurpose(text) {
  if (/investment|yield|rental|rent|استثمار|عوائد|إيجار|ايجار/i.test(text)) return "investment";
  if (/family|schools|school|عائلة|عائله|مدارس/i.test(text)) return "family_use";
  if (/residency|citizenship|visa|إقامة|اقامة|جنسية|جنسيه/i.test(text)) return "residency";
  if (/education|university|جامعة|جامعه|تعليم/i.test(text)) return "education";
  if (/relocation|move|سكن|انتقال/i.test(text)) return "relocation";
  return null;
}

function detectTimeline(text) {
  if (/now|immediate|ready now|this month|فورا|الآن|الان/i.test(text)) return "immediate";
  if (/1[-\s]?3|90 days|three months|٣ شهور|3 شهور|ثلاث/i.test(text)) return "1_to_3_months";
  if (/3[-\s]?6|six months|٦ شهور|6 شهور/i.test(text)) return "3_to_6_months";
  if (/6[-\s]?12|year|سنة|سنه/i.test(text)) return "6_to_12_months";
  if (/explor|watching|browsing|استكشف|اتصفح/i.test(text)) return "exploratory";
  return null;
}

function detectFinancing(text) {
  if (/cash|نقد|كاش|جاهز/i.test(text)) return "cash_ready";
  if (/pre.?approved|mortgage|financ|قرض|تمويل|بنك/i.test(text)) return "financing_ready";
  if (/mixed|part cash|part financing|جزء/i.test(text)) return "mixed";
  if (/monthly|payment|قسط|شهري/i.test(text)) return "needs_financing_guidance";
  return null;
}

function detectReadiness(text) {
  if (/off.?plan|under construction|على الخارطة|تحت الإنشاء|تحت الانشاء/i.test(text)) return "off_plan";
  if (/ready|جاهز|جاهزة|تسليم/i.test(text)) return "ready";
  return null;
}

function parseBudget(text) {
  const currency = detectCurrency(text);
  const searchable = text.replace(/\b\d+\s*[-]?\s*(bedroom|bed|br)\b/gi, "").replace(/\d+\s*غرف/gi, "");
  const matches = [...searchable.matchAll(/(\d+(?:[,.]\d+)?)\s*(million|thousand|mio|mn|m|k|مليون|آلاف|الاف|ألف|الف)?/gi)];
  const values = matches.map(numberFromMatch).filter((value) => Number.isFinite(value) && value > 0);
  if (!values.length) return { currency };
  const monthlyContext = /monthly|payment|قسط|شهري/i.test(text);
  const largest = Math.max(...values);
  if (monthlyContext && largest < 100_000) {
    return { monthly_payment_max: largest, currency };
  }
  return { budget_max: largest, budget_min: values.length > 1 ? Math.min(...values) : null, currency };
}

function isDomainRelevant(text, intent) {
  if (!text) return false;
  const estateWords = /property|home|house|apartment|villa|real estate|listing|broker|buy|rent|عقار|بيت|منزل|شقة|شقه|فيلا|شراء|وسيط/i;
  return Boolean(estateWords.test(text) || intent.property_type || intent.city?.length || intent.budget_max || intent.monthly_payment_max);
}

function buildMissing(intent) {
  const missing = [];
  if (!intent.target_country_codes?.length && !intent.city?.length) missing.push("target_market");
  if (!intent.property_type) missing.push("property_type");
  if (!intent.budget_max && !intent.monthly_payment_max) missing.push("budget_or_monthly_payment");
  if (!intent.financing_posture) missing.push("financing_posture");
  if (!intent.timeline) missing.push("timeline");
  return missing;
}

function nextQuestionFor(missing, locale) {
  const ar = locale === "ar";
  const key = missing[0];
  const questions = {
    target_market: ar ? "أي مدينة أو حي تفضّل أن أبدأ منه؟" : "Which city or district should I start with?",
    property_type: ar ? "هل تبحث عن شقة، فيلا، أرض، أو نوع آخر؟" : "Are you looking for an apartment, villa, land, or another property type?",
    budget_or_monthly_payment: ar ? "ما الميزانية أو القسط الشهري المناسب لك؟" : "What budget or monthly payment range should I stay under?",
    financing_posture: ar ? "هل الشراء كاش أم عن طريق تمويل؟" : "Are you buying cash or with financing?",
    timeline: ar ? "متى تتوقع الشراء: الآن، خلال ٣ أشهر، أم لاحقًا؟" : "When are you hoping to buy: now, within 3 months, or later?",
  };
  return questions[key] || (ar ? "أقدر أبدأ البحث بعد التحقق. هل نكمل؟" : "I can start a verified search after signup. Shall we continue?");
}

function previewText(intent, locale) {
  const ar = locale === "ar";
  const location = intent.city?.[0] || intent.target_country_codes?.[0] || (ar ? "السوق المناسب" : "your target market");
  const property = intent.property_type || (ar ? "عقار" : "property");
  if (ar) return `فهمت: ${property} في ${location}. سأحوّل هذا إلى تفويض شراء واضح قبل تشغيل البحث المباشر.`;
  return `Got it: ${property} in ${location}. I’ll turn this into a clear buyer mandate before running live search.`;
}

function makeSampleCards(intent, locale) {
  const ar = locale === "ar";
  const city = intent.city?.[0] || (intent.target_country_codes?.[0] === "AE" ? "Dubai" : intent.target_country_codes?.[0] === "TR" ? "Istanbul" : "Riyadh");
  const property = intent.property_type || "apartment";
  return [
    {
      title: ar ? `خيار ${property} مناسب للتفويض` : `Mandate-fit ${property}`,
      location: city,
      note: ar ? "بطاقة عينة فقط. البحث المباشر يبدأ بعد التحقق." : "Sample card only. Live search starts after verification.",
      preview_kind: "sample_preview",
    },
    {
      title: ar ? "خيار يحتاج تحقق من التوفر" : "Option needing availability check",
      location: city,
      note: ar ? "سنحفظ رابط المصدر والتوقيت عند تشغيل البحث." : "We preserve source URL and timestamp when live search runs.",
      preview_kind: "sample_preview",
    },
  ];
}

export function parseMihadScoutIntent(input = {}) {
  const text = cleanText(input.prompt || input.text || "");
  const locale = input.locale === "ar" || hasArabic(text) ? "ar" : "en";
  const location = detectLocations(text);
  const budget = parseBudget(text);
  const propertyType = detectPropertyType(text);
  const intent = {
    locale,
    raw_language: locale,
    target_country_codes: location.countries.length ? location.countries : [],
    city: location.cities,
    districts: [],
    property_type: propertyType && PROPERTY_TYPES.has(propertyType) ? propertyType : null,
    budget_min: budget.budget_min || null,
    budget_max: budget.budget_max || null,
    monthly_payment_max: budget.monthly_payment_max || null,
    currency: budget.currency || "SAR",
    purpose: detectPurpose(text),
    readiness: detectReadiness(text),
    financing_posture: detectFinancing(text),
    timeline: detectTimeline(text),
    must_haves: [],
    avoid: [],
    confidence: 0,
    missing_fields: [],
  };
  const domainRelevant = isDomainRelevant(text, intent);
  const missing = buildMissing(intent);
  const filled = 5 - missing.length;
  intent.confidence = domainRelevant ? Math.max(0.22, Math.min(0.92, 0.22 + filled * 0.14)) : 0;
  intent.missing_fields = missing;
  const gateState = !domainRelevant
    ? "needs_clarification"
    : missing.length <= 2
      ? "ready_for_auth"
      : "needs_clarification";
  return {
    accepted: domainRelevant,
    model: process.env.MIHAD_INTENT_MODEL || "gpt-5.4-mini",
    source: "deterministic",
    intent,
    turn: {
      role: "assistant",
      text: domainRelevant
        ? previewText(intent, locale)
        : locale === "ar"
          ? "أقدر أساعد فقط في طلبات شراء العقار والبحث العقاري."
          : "I can only help with property buying and real estate search requests.",
      intent_delta: intent,
      next_question: nextQuestionFor(missing, locale),
      gate_state: gateState,
    },
    preview_cards: domainRelevant ? makeSampleCards(intent, locale) : [],
  };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(String(text || "").trim());
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeModelIntent(candidate, fallback) {
  if (!candidate || typeof candidate !== "object") return fallback.intent;
  const next = { ...fallback.intent };
  if (Array.isArray(candidate.target_country_codes)) {
    next.target_country_codes = uniq(
      candidate.target_country_codes.map((code) => String(code || "").toUpperCase()).filter((code) => LAUNCH_COUNTRIES.has(code)),
    );
  }
  if (Array.isArray(candidate.city)) next.city = uniq(candidate.city.map(cleanText));
  if (Array.isArray(candidate.districts)) next.districts = uniq(candidate.districts.map(cleanText));
  if (PROPERTY_TYPES.has(candidate.property_type)) next.property_type = candidate.property_type;
  for (const key of ["budget_min", "budget_max", "monthly_payment_max"]) {
    const value = Number(candidate[key]);
    if (Number.isFinite(value) && value > 0) next[key] = value;
  }
  if (["SAR", "AED", "TRY", "EUR", "USD"].includes(candidate.currency)) next.currency = candidate.currency;
  for (const key of ["purpose", "readiness", "financing_posture", "timeline"]) {
    if (typeof candidate[key] === "string" && candidate[key].trim()) next[key] = candidate[key].trim();
  }
  if (Array.isArray(candidate.must_haves)) next.must_haves = uniq(candidate.must_haves.map(cleanText)).slice(0, 8);
  if (Array.isArray(candidate.avoid)) next.avoid = uniq(candidate.avoid.map(cleanText)).slice(0, 8);
  next.missing_fields = buildMissing(next);
  next.confidence = Math.max(fallback.intent.confidence, Math.min(0.94, Number(candidate.confidence) || fallback.intent.confidence));
  return next;
}

export async function parseMihadScoutIntentWithModel(input = {}, options = {}) {
  const fallback = parseMihadScoutIntent(input);
  const hasCredential = Boolean(process.env.OPENAI_API_KEY || process.env.VERTEX_OPENAI_BASE_URL);
  if (!fallback.accepted || !hasCredential || process.env.MIHAD_INTENT_AI === "disabled") {
    return fallback;
  }

  const model = process.env.MIHAD_INTENT_MODEL || "gpt-5.4-mini";
  try {
    const response = await createChatCompletion({
      model,
      messages: [
        {
          role: "system",
          content:
            "You extract buyer-side real-estate search intent for Mihad. Return JSON only. Launch countries are SA, AE, TR. Do not answer unrelated prompts. Do not trigger search or outreach.",
        },
        {
          role: "user",
          content: JSON.stringify({
            prompt: input.prompt || input.text || "",
            deterministic_intent: fallback.intent,
            required_shape: {
              target_country_codes: ["SA"],
              city: ["Riyadh"],
              districts: [],
              property_type: "apartment",
              budget_min: null,
              budget_max: null,
              monthly_payment_max: null,
              currency: "SAR",
              purpose: "family_use",
              readiness: "ready",
              financing_posture: "financing_ready",
              timeline: "1_to_3_months",
              must_haves: [],
              avoid: [],
              confidence: 0.8,
            },
          }),
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 700,
    }, { requestId: options.requestId });
    const parsed = safeJsonParse(extractOutputText(response));
    if (!parsed) return fallback;
    const intent = normalizeModelIntent(parsed, fallback);
    const missing = buildMissing(intent);
    return {
      ...fallback,
      source: "model",
      model,
      intent,
      turn: {
        ...fallback.turn,
        intent_delta: intent,
        next_question: nextQuestionFor(missing, intent.locale),
        gate_state: missing.length <= 2 ? "ready_for_auth" : "needs_clarification",
      },
      preview_cards: makeSampleCards(intent, intent.locale),
    };
  } catch {
    return fallback;
  }
}
