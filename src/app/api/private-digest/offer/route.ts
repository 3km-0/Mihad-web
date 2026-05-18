import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { findSpace, localizedValue, makeOfferReference, validateSpaceOffer } from '@/lib/private-digest';

function normalizeWorkspaceId(value: string | undefined) {
  const clean = String(value || '').trim();
  return clean || null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateSpaceOffer(body);

  if (!validation.ok) {
    return NextResponse.json({ error: 'Please add a message.', errors: validation.errors }, { status: 400 });
  }

  const space = findSpace(validation.data.spaceSlug);
  if (!space) {
    return NextResponse.json({ error: 'Space not found.' }, { status: 404 });
  }

  const reference = makeOfferReference();
  const workspaceId = normalizeWorkspaceId(process.env.PRIVATE_DIGEST_INTAKE_WORKSPACE_ID);
  const title = localizedValue('en', space.title);
  const admin = (await createServiceClient()) as any;
  const { error } = await admin
    .from('support_tickets')
    .insert({
      workspace_id: workspaceId,
      category: 'general',
      priority: 'normal',
      source: 'private_digest_offer',
      subject: `${reference} - ${title}`,
      message: `Architecture digest offer note for ${title}. Reference ${reference}.`,
      status: 'open',
      metadata: {
        reference,
        space: {
          slug: space.slug,
          title: space.title,
          status: space.status,
          visibility: space.visibility,
        },
        intake: {
          name: validation.data.name || null,
          contact: validation.data.contact || null,
          message: validation.data.message,
        },
        checklist: {
          source_authenticity: 'pending',
          image_media_approval: 'pending',
          privacy_setting: 'pending',
          offer_seriousness: 'pending',
          follow_up_admin_decision: 'pending',
          next_action_owner: 'pending',
        },
      },
    });

  if (error) {
    return NextResponse.json({ error: 'Unable to send message.' }, { status: 500 });
  }

  return NextResponse.json({
    reference,
    status: 'received_for_manual_review',
    message: 'The note was received and will be reviewed manually.',
  });
}
