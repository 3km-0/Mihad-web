import type { UserFacingError } from '@/lib/errors';

type UiLocale = 'en' | 'ar';

export interface PlanLimitContext {
  limitKey?: string;
  current?: number;
  max?: number;
  tier?: string;
  effectiveTier?: string;
}

function tr(locale: UiLocale, en: string, ar: string): string {
  return locale === 'ar' ? ar : en;
}

function normalizeTierLabel(tier: string | undefined, locale: UiLocale): string {
  const value = String(tier || 'free').trim().toLowerCase();
  const labels: Record<string, { en: string; ar: string }> = {
    free: { en: 'Free', ar: 'مجاني' },
    pro: { en: 'Core (Pro)', ar: 'أساسي (Pro)' },
    core: { en: 'Core', ar: 'أساسي' },
    premium: { en: 'Investor Pro', ar: 'مستثمر Pro' },
    team: { en: 'Team', ar: 'فريق' },
    ultra: { en: 'Ultra', ar: 'Ultra' },
    exam_prep: { en: 'Exam prep', ar: 'تحضير امتحان' },
    student_monthly: { en: 'Student', ar: 'طالب' },
    student_semester: { en: 'Student', ar: 'طالب' },
  };
  const label = labels[value];
  return label ? tr(locale, label.en, label.ar) : value;
}

/** Parse "Active study spaces: 6 of 0" style copy and backend limit payloads. */
export function parsePlanLimitContext(input: unknown): PlanLimitContext | null {
  if (!input || typeof input !== 'object') {
    if (typeof input === 'string') return parsePlanLimitContext({ message: input });
    return null;
  }

  const record = input as Record<string, unknown>;
  const message = String(record.message ?? record.details ?? record.error ?? '').trim();
  const limitKey = String(record.limit_key ?? record.limitKey ?? record.feature ?? '').trim();

  let current = readNumber(record.current ?? record.current_count ?? record.used);
  let max = readNumber(record.limit ?? record.max ?? record.max_limit ?? record.allowed);

  const ofMatch = message.match(/(\d+)\s*of\s*(\d+)/i);
  if (ofMatch) {
    current = Number(ofMatch[1]);
    max = Number(ofMatch[2]);
  }

  const tier = String(record.tier ?? record.current_tier ?? record.effective_tier ?? '').trim() || undefined;

  const isStudyLimit =
    /study\s*space|readiness\s*space|max_study_spaces/i.test(`${limitKey} ${message}`) ||
    ofMatch !== null;

  if (!isStudyLimit && current === undefined && max === undefined) return null;

  return {
    limitKey: limitKey || (isStudyLimit ? 'max_study_spaces' : undefined),
    current,
    max,
    tier,
    effectiveTier: String(record.effective_tier ?? '').trim() || undefined,
  };
}

function readNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function buildStudySpaceLimitError(
  context: PlanLimitContext,
  locale: UiLocale = 'en'
): UserFacingError {
  const current = context.current ?? 0;
  const max = context.max ?? 0;
  const tierLabel = normalizeTierLabel(context.effectiveTier ?? context.tier, locale);

  const atCap = max > 0 && current >= max;
  const noAllowance = max <= 0;

  let message: string;
  if (noAllowance) {
    message = tr(
      locale,
      `Your ${tierLabel} plan does not include new study spaces (you have ${current} active, allowance ${max}). Upgrade to Core (Pro) or restore your App Store subscription, then try again.`,
      `باقتك ${tierLabel} لا تتضمن مساحات دراسة جديدة (لديك ${current} نشطة، والحد ${max}). قم بالترقية إلى أساسي (Pro) أو استعد اشتراك App Store ثم حاول مرة أخرى.`
    );
  } else if (atCap) {
    message = tr(
      locale,
      `You have ${current} of ${max} active study spaces on ${tierLabel}. Archive or delete a space, or upgrade for a higher limit.`,
      `لديك ${current} من ${max} مساحات دراسة نشطة على باقة ${tierLabel}. أرشِف مساحة أو احذفها، أو قم بالترقية لرفع الحد.`
    );
  } else {
    message = tr(
      locale,
      `Study space limit reached (${current} of ${max}) on ${tierLabel}. Upgrade or free up a space to continue.`,
      `تم بلوغ حد مساحات الدراسة (${current} من ${max}) على باقة ${tierLabel}. قم بالترقية أو وفّر مساحة للمتابعة.`
    );
  }

  return {
    title: tr(locale, 'Study space limit', 'حد مساحات الدراسة'),
    message,
    category: 'limit',
    action: 'upgrade',
    durationMs: 18_000,
  };
}

export function mapPlanLimitError(error: unknown, locale: UiLocale = 'en'): UserFacingError | null {
  const context = parsePlanLimitContext(error);
  if (!context) return null;
  if (context.limitKey === 'max_study_spaces' || /study|readiness/i.test(String(context.limitKey))) {
    return buildStudySpaceLimitError(context, locale);
  }
  if (context.current !== undefined && context.max !== undefined) {
    return buildStudySpaceLimitError(context, locale);
  }
  return null;
}
