'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import type { StepProps } from './types';

export function PhoneStep({ data, setData }: StepProps) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (nextChannel = channel) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/onboarding/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone, channel: nextChannel }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to send code');
      setChannel(payload.channel === 'sms' ? 'sms' : 'whatsapp');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/onboarding/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone, code, channel }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Invalid code');
      setData({ phoneVerified: true, phone: payload.phone_number || data.phone });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Phone number"
        placeholder="+9665..."
        value={data.phone}
        onChange={(event) => setData({ phone: event.target.value, phoneVerified: false })}
        autoComplete="tel"
        inputMode="tel"
        disabled={data.phoneVerified}
        hint="Use international format. We verify once during onboarding and use WhatsApp by default."
      />
      {!data.phoneVerified ? (
        <div className="rounded-zohal border border-border bg-surface-alt p-3 text-sm text-text-soft">
          Verification will be sent by {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.
          {sent ? ' If it does not arrive, try the other channel.' : ' You can switch to SMS if WhatsApp is unavailable.'}
        </div>
      ) : null}
      {sent && !data.phoneVerified ? (
        <Input
          label="Verification code"
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))}
          inputMode="numeric"
        />
      ) : null}
      {data.phoneVerified ? (
        <div className="rounded-zohal border border-success/30 bg-success/10 p-3 text-sm text-success">
          Phone verified.
        </div>
      ) : null}
      {error ? <div className="rounded-zohal border border-error/30 bg-error/10 p-3 text-sm text-error">{error}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="secondary" onClick={() => sendCode(channel)} isLoading={loading} disabled={!data.phone || data.phoneVerified}>
          {sent ? `Resend by ${channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}` : 'Send by WhatsApp'}
        </Button>
        {!data.phoneVerified ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const nextChannel = channel === 'whatsapp' ? 'sms' : 'whatsapp';
              setChannel(nextChannel);
              if (sent) void sendCode(nextChannel);
            }}
            disabled={!data.phone || loading}
          >
            {channel === 'whatsapp' ? 'Use SMS instead' : 'Use WhatsApp instead'}
          </Button>
        ) : null}
        {sent && !data.phoneVerified ? (
          <Button type="button" onClick={verifyCode} isLoading={loading} disabled={code.length < 4 || loading}>
            Verify
          </Button>
        ) : null}
      </div>
      {sent && !data.phoneVerified ? (
        <p className="text-xs leading-5 text-text-muted">
          Codes expire quickly. If verification says the code was already used or expired, resend a fresh code.
        </p>
      ) : null}
    </div>
  );
}
