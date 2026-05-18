import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const insertMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      insert: insertMock,
    })),
  })),
}));

function jsonRequest(body: Record<string, unknown>) {
  return new Request('https://mihad.properties/api/private-digest/offer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('private digest offer API', () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it('rejects empty messages', async () => {
    const response = await POST(jsonRequest({ spaceSlug: 'editorial-format-preview', message: '' }));
    expect(response.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('creates a sanitized admin intake record without echoing payload details', async () => {
    const response = await POST(jsonRequest({
      spaceSlug: 'editorial-format-preview',
      name: 'Person',
      contact: '+966500000000',
      message: 'I would like to discuss this space quietly.',
    }));
    const payload = await response.json();
    const inserted = insertMock.mock.calls[0]?.[0];

    expect(response.status).toBe(200);
    expect(payload.reference).toMatch(/^OFFER-/);
    expect(payload.message).not.toContain('+966500000000');
    expect(payload.message).not.toContain('discuss this space');
    expect(inserted.source).toBe('private_digest_offer');
    expect(inserted.metadata.intake.message).toBe('I would like to discuss this space quietly.');
    expect(inserted.metadata.checklist.offer_seriousness).toBe('pending');
  });
});
