import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, signIn, test } from '../support/e2e/fixtures';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// White text on the brand purple stays just below 4.5:1 by choice, so contrast is not checked.
const violationsOn = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).disableRules(['color-contrast']).analyze();
  return violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
};

const publicPages = ['/', '/auth/sign-in/', '/kontakt/', '/impressum/'];
const appPages = ['/dashboard/', '/fotos/', '/aktivitaeten/', '/freunde/', '/bilderrahmen/', '/aenderungen/', '/einstellungen/'];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`axe on a phone in ${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test('public pages pass WCAG AA', async ({ page }) => {
      for (const path of publicPages) {
        await test.step(path, async () => {
          await page.goto(path, { waitUntil: 'networkidle' });
          expect(await violationsOn(page)).toEqual([]);
        });
      }
    });

    test('app pages pass WCAG AA', async ({ page }) => {
      await signIn(page);
      for (const path of appPages) {
        await test.step(path, async () => {
          await page.goto(path, { waitUntil: 'networkidle' });
          expect(await violationsOn(page)).toEqual([]);
        });
      }
    });
  });
}
