import { test as base, expect, Page } from '@playwright/test';
import { alice } from './credentials';

const CHANGELOG_DIALOG = 'Neue Änderungen während deiner Abwesenheit';

/**
 * A fresh database greets every first sign-in with the newest changelog, and the
 * dialog swallows clicks until it is closed.
 */
export const dismissChangelogDialog = async (page: Page) => {
  const dialog = page.getByRole('dialog').filter({ hasText: CHANGELOG_DIALOG });

  await dialog.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
  if (await dialog.isVisible()) {
    await dialog.getByRole('button', { name: 'Schließen' }).click();
    await expect(dialog).toBeHidden();
  }
};

export const signIn = async (page: Page, user = alice) => {
  await page.goto('/auth/sign-in/');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Passwort').fill(user.password);
  await page.getByRole('button', { name: 'anmelden' }).click();
  await expect(page).toHaveURL(/\/dashboard\/$/);
  await dismissChangelogDialog(page);
};

// Signs in once per test that asks for it; the JWT lives in HttpOnly cookies,
// so the browser context carries the session from here on.
export const test = base.extend<{ signedInPage: Page }>({
  signedInPage: async ({ page }, use) => {
    await signIn(page);
    await use(page);
  },
});

export { expect };
