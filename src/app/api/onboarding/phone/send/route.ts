import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^\d+]/g, '').trim();
}

function twilioAuthHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
}

function normalizeChannel(value: unknown) {
  return value === 'sms' ? 'sms' : 'whatsapp';
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError('Not authenticated', 401);
  }

  const body = (await request.json().catch(() => null)) as { phone?: unknown; channel?: unknown } | null;
  const phone = normalizePhone(body?.phone);
  const channel = normalizeChannel(body?.channel);
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return jsonError('Enter a valid phone number in international format.', 400, 'invalid_phone');
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    return jsonError('Phone verification is not configured.', 503, 'twilio_not_configured');
  }

  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization: twilioAuthHeader(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone,
      Channel: channel,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return jsonError(data?.message || `Failed to send ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} verification code.`, response.status);
  }

  return NextResponse.json({ success: true, status: data?.status || 'pending', channel });
}
