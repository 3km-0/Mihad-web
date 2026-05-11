import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^\d+]/g, '').trim();
}

function normalizeCode(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.replace(/\D/g, '').slice(0, 10);
}

function normalizeChannel(value: unknown) {
  return value === 'sms' ? 'sms' : 'whatsapp';
}

function twilioAuthHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
}

function isTwilioMissingVerification(data: Record<string, unknown>, status: number) {
  return status === 404 && String(data?.message || '').includes('VerificationCheck was not found');
}

function phoneAlreadyInUseError() {
  return jsonError(
    'This phone number is already saved on another Zohal account. Please sign in to that account or use a different number.',
    409,
    'phone_already_in_use'
  );
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

  const body = (await request.json().catch(() => null)) as { phone?: unknown; code?: unknown; channel?: unknown } | null;
  const phone = normalizePhone(body?.phone);
  const code = normalizeCode(body?.code);
  const channel = normalizeChannel(body?.channel);
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return jsonError('Enter a valid phone number in international format.', 400, 'invalid_phone');
  }
  if (code.length < 4) {
    return jsonError('Enter the verification code.', 400, 'invalid_code');
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) {
    return jsonError('Phone verification is not configured.', 503, 'twilio_not_configured');
  }

  const response = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`, {
    method: 'POST',
    headers: {
      Authorization: twilioAuthHeader(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: phone,
      Code: code,
    }),
  });

  const verifiedAt = new Date().toISOString();
  const service = await createServiceClient();
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.status !== 'approved') {
    const { data: existingProfile } = await service
      .from('profiles')
      .select('phone_number, phone_verified_at')
      .eq('id', user.id)
      .maybeSingle();

    if (
      isTwilioMissingVerification(data, response.status) &&
      existingProfile?.phone_number === phone &&
      existingProfile?.phone_verified_at
    ) {
      return NextResponse.json({
        success: true,
        phone_number: phone,
        phone_verified_at: existingProfile.phone_verified_at,
        already_verified: true,
      });
    }

    if (isTwilioMissingVerification(data, response.status)) {
      return jsonError(
        'This verification code expired or was already used. Please resend the code and try again.',
        400,
        'verification_expired_or_used'
      );
    }

    return jsonError(data?.message || 'Invalid verification code.', response.ok ? 400 : response.status, 'verification_failed');
  }

  const { data: existingPhoneProfiles } = await service
    .from('profiles')
    .select('id')
    .or(`phone_number.eq.${phone},whatsapp_phone_number.eq.${phone}`)
    .limit(2);

  const otherPhoneProfile = existingPhoneProfiles?.find((profile) => profile.id !== user.id);
  if (otherPhoneProfile) {
    return phoneAlreadyInUseError();
  }

  const { error: updateError } = await service
    .from('profiles')
    .update({
      phone_number: phone,
      whatsapp_phone_number: phone,
      phone_verified_at: verifiedAt,
      phone_verification_provider: `twilio_${channel}`,
      updated_at: verifiedAt,
    })
    .eq('id', user.id);

  if (updateError) {
    if (updateError.code === '23505') {
      return phoneAlreadyInUseError();
    }
    return jsonError('Failed to save verified phone number.', 500);
  }

  return NextResponse.json({
    success: true,
    phone_number: phone,
    phone_verified_at: verifiedAt,
    channel,
    whatsapp_binding_status: 'bound',
  });
}
