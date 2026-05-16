import { zohalBackendUrl } from '@/lib/zohal-backend';
import { NextResponse } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const PREVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PREVIEWS_PER_WINDOW = 1;
const PREVIEW_COOKIE = 'mihad_preview_seen';
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const previewLimit = new Map<string, { count: number; resetAt: number }>();

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function internalBackendHeaders() {
  const token = (
    process.env.INTERNAL_FUNCTION_JWT ||
    process.env.INTERNAL_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: token,
    'x-internal-function-jwt': token,
  };
}

function rateLimitKey(request: Request, sessionId: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  return `${forwarded || realIp || 'unknown'}:${sessionId || 'anonymous'}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const existing = rateLimit.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  existing.count += 1;
  return existing.count > MAX_REQUESTS_PER_WINDOW;
}

function canRunPreview(key: string) {
  const now = Date.now();
  const existing = previewLimit.get(key);
  if (!existing || existing.resetAt <= now) {
    previewLimit.set(key, { count: 1, resetAt: now + PREVIEW_WINDOW_MS });
    return true;
  }
  existing.count += 1;
  return existing.count <= MAX_PREVIEWS_PER_WINDOW;
}

function hasPreviewCookie(request: Request) {
  return request.headers
    .get('cookie')
    ?.split(';')
    .some((part) => part.trim().startsWith(`${PREVIEW_COOKIE}=`)) ?? false;
}

function markPreviewAttempt(response: NextResponse) {
  response.cookies.set(PREVIEW_COOKIE, '1', {
    httpOnly: true,
    maxAge: PREVIEW_WINDOW_MS / 1000,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });
  return response;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    prompt?: unknown;
    locale?: unknown;
    session_id?: unknown;
  } | null;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const locale = body?.locale === 'ar' ? 'ar' : 'en';
  const sessionId = typeof body?.session_id === 'string' ? body.session_id.slice(0, 80) : '';

  if (prompt.length < 4) return jsonError('Describe what you are looking for.', 400, 'prompt_too_short');
  if (prompt.length > 1200) return jsonError('Keep the request under 1,200 characters.', 413, 'prompt_too_long');
  const key = rateLimitKey(request, sessionId);
  if (isRateLimited(key)) {
    return jsonError('Too many scout requests. Please try again in a minute.', 429, 'rate_limited');
  }

  const headers = internalBackendHeaders();
  if (!headers) return jsonError('Mihad scout is not configured.', 503, 'internal_token_missing');

  const response = await fetch(zohalBackendUrl('/internal/acquisition/intent/parse'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, locale }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return jsonError(
      payload?.error === 'unsupported_intent'
        ? 'Mihad can only help with property buying and real estate search requests.'
        : payload?.message || payload?.error || 'Failed to parse this request.',
      response.status,
      payload?.error || 'intent_parse_failed',
    );
  }

  const previewAllowed = !hasPreviewCookie(request) && canRunPreview(key);
  if (!previewAllowed) {
    return NextResponse.json({
      ...payload,
      preview_status: {
        live_preview: false,
        reason: 'anonymous_preview_limit',
      },
    });
  }

  const previewResponse = await fetch(zohalBackendUrl('/internal/acquisition/intent/preview'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ intent: payload.intent, locale }),
    cache: 'no-store',
  }).catch(() => null);

  if (!previewResponse?.ok) {
    return markPreviewAttempt(NextResponse.json({
      ...payload,
      preview_status: {
        live_preview: false,
        reason: previewResponse ? `preview_${previewResponse.status}` : 'preview_failed',
      },
    }));
  }

  const previewPayload = await previewResponse.json().catch(() => ({}));
  return markPreviewAttempt(NextResponse.json({
    ...payload,
    preview_cards: Array.isArray(previewPayload.preview_cards) && previewPayload.preview_cards.length
      ? previewPayload.preview_cards
      : payload.preview_cards,
    preview_status: {
      live_preview: Boolean(previewPayload.live_preview),
      reason: previewPayload.reason || null,
      cached: Boolean(previewPayload.cached),
      source: previewPayload.source || null,
      adapter_runs: previewPayload.adapter_runs || [],
    },
  }));
}
