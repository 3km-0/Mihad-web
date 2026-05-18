import { NextResponse } from 'next/server';
import { buildDigestWhatsappUrl, findProperty, makeReference, validatePrivateInterest } from '@/lib/private-digest';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validatePrivateInterest(body);

  if (!validation.ok) {
    return NextResponse.json({ error: 'Please complete the required private interest fields.', errors: validation.errors }, { status: 400 });
  }

  const property = validation.data.propertySlug ? findProperty(validation.data.propertySlug) : null;
  const reference = makeReference('INTEREST');

  return NextResponse.json({
    reference,
    status: 'received_for_broker_screening',
    property: property ? { slug: property.slug, title: property.title } : null,
    next_step: 'Mihad will manually screen identity, intent, funding readiness, and timing before approaching any owner.',
    interest: validation.data,
    whatsapp_url: buildDigestWhatsappUrl({ reference, path: 'interest', phone: validation.data.phone }),
  });
}
