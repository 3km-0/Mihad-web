import { describe, expect, it } from 'vitest';
import {
  findSpace,
  publicSpaces,
  sitemapSpaces,
  validateSpaceOffer,
} from './private-digest';
import sitemap from '@/app/sitemap';

describe('private digest data', () => {
  it('excludes private-link space pages from public gallery and sitemap', () => {
    expect(findSpace('editorial-format-preview')).toBeTruthy();
    expect(publicSpaces().map((space) => space.slug)).not.toContain('editorial-format-preview');
    expect(sitemapSpaces().map((space) => space.slug)).not.toContain('editorial-format-preview');
  });

  it('indexes spaces but excludes retired intake routes', () => {
    const urls = sitemap().map((item) => item.url);
    expect(urls).toContain('https://mihad.properties/spaces');
    expect(urls).not.toContain('https://mihad.properties/properties');
    expect(urls).not.toContain('https://mihad.properties/submit-property');
    expect(urls).not.toContain('https://mihad.properties/private-interest');
  });
});

describe('space offer validation', () => {
  it('requires a space and a message', () => {
    expect(validateSpaceOffer({ spaceSlug: 'editorial-format-preview', message: 'A quiet note.' }).ok).toBe(true);
    const invalid = validateSpaceOffer({
      spaceSlug: 'editorial-format-preview',
      message: '',
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.errors.message).toBeTruthy();
  });
});
