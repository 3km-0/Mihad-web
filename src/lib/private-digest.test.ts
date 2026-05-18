import { describe, expect, it } from 'vitest';
import {
  findProperty,
  publicProperties,
  sitemapProperties,
  validateOwnerSubmission,
  validatePrivateInterest,
} from './private-digest';

describe('private digest data', () => {
  it('excludes private-link property pages from public gallery and sitemap', () => {
    expect(findProperty('editorial-format-preview')).toBeTruthy();
    expect(publicProperties().map((property) => property.slug)).not.toContain('editorial-format-preview');
    expect(sitemapProperties().map((property) => property.slug)).not.toContain('editorial-format-preview');
  });
});

describe('private digest validation', () => {
  it('validates owner submissions', () => {
    const valid = validateOwnerSubmission({
      name: 'Owner',
      phone: '+966500000000',
      role: 'Authorized representative',
      city: 'Riyadh',
      propertyType: 'Villa',
      privacyPreference: 'Private link',
      originalMediaReady: true,
      consent: true,
      notes: 'Quiet review.',
    });

    expect(valid.ok).toBe(true);
    expect(validateOwnerSubmission({}).ok).toBe(false);
  });

  it('validates private buyer interest', () => {
    const valid = validatePrivateInterest({
      propertySlug: 'editorial-format-preview',
      fullName: 'Buyer',
      phone: '+966511111111',
      location: 'Riyadh',
      intent: 'Family use',
      indicativeRange: 'Confidential range',
      fundingStatus: 'Cash',
      timeline: '30-90 days',
      proofReadiness: 'Can verify privately',
      ndaOpen: true,
      consent: true,
    });

    expect(valid.ok).toBe(true);
    expect(validatePrivateInterest({ fullName: 'Buyer' }).ok).toBe(false);
  });
});
