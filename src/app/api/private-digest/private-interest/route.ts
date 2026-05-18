import { NextResponse } from 'next/server';
import { buildDigestWhatsappUrl, findSpace, makeReference, validatePrivateInterest } from '@/lib/private-digest';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validatePrivateInterest(body);

  if (!validation.ok) {
    return NextResponse.json({ error: 'Please complete the required private interest fields.', errors: validation.errors }, { status: 400 });
  }

  const space = validation.data.propertySlug ? findSpace(validation.data.propertySlug) : null;
  const reference = makeReference('INTEREST');

  return NextResponse.json({
    reference,
    status: 'received_for_broker_screening',
    property: space ? { slug: space.slug, title: space.title } : null,
    next_step: 'Mihad will manually screen identity, intent, funding readiness, and timing before approaching any owner.',
    interest: validation.data,
    whatsapp_url: buildDigestWhatsappUrl({ reference, path: 'interest', phone: validation.data.phone }),
  });
}
