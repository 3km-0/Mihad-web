import { describe, expect, it } from 'vitest';
import PropertiesPage from './properties/page';
import PropertyPage from './properties/[slug]/page';
import SubmitPropertyPage from './submit-property/page';
import PrivateInterestPage from './private-interest/page';

function expectRedirect(fn: () => unknown, target: string) {
  try {
    fn();
    throw new Error('Expected redirect');
  } catch (error) {
    expect((error as { digest?: string }).digest).toContain(target);
  }
}

async function expectAsyncRedirect(fn: () => Promise<unknown>, target: string) {
  try {
    await fn();
    throw new Error('Expected redirect');
  } catch (error) {
    expect((error as { digest?: string }).digest).toContain(target);
  }
}

describe('retired public routes', () => {
  it('redirects /properties to /spaces', () => {
    expectRedirect(() => PropertiesPage(), '/spaces');
  });

  it('redirects /properties/[slug] to /spaces/[slug]', async () => {
    await expectAsyncRedirect(
      () => PropertyPage({ params: Promise.resolve({ slug: 'editorial-format-preview' }) }),
      '/spaces/editorial-format-preview'
    );
  });

  it('redirects old intake routes to /home', () => {
    expectRedirect(() => SubmitPropertyPage(), '/home');
    expectRedirect(() => PrivateInterestPage(), '/home');
  });
});
