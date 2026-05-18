import { NextResponse } from 'next/server';
import { buildDigestWhatsappUrl, makeReference, validateOwnerSubmission } from '@/lib/private-digest';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateOwnerSubmission(body);

  if (!validation.ok) {
    return NextResponse.json({ error: 'Please complete the required private owner fields.', errors: validation.errors }, { status: 400 });
  }

  const reference = makeReference('OWNER');

  return NextResponse.json({
    reference,
    status: 'received_for_manual_review',
    next_step: 'Mihad will manually review privacy, authority, and fit before any publication or buyer sharing.',
    submission: validation.data,
    whatsapp_url: buildDigestWhatsappUrl({ reference, path: 'owner', phone: validation.data.phone }),
  });
}
