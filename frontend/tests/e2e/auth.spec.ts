import { expect, signIn, test } from '../support/e2e/fixtures';
import { alice } from '../support/e2e/credentials';

test.describe('authentication', () => {
  test('signs a seeded user in and lands on the dashboard', async ({ page }) => {
    await signIn(page);

    await expect(page).toHaveTitle('Start – ShareFrame');
    await expect(page.getByRole('link', { name: 'Fotos' }).first()).toBeVisible();
  });

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/auth/sign-in/');
    await page.getByLabel('Email').fill(alice.email);
    await page.getByLabel('Passwort').fill('falsches-passwort');
    await page.getByRole('button', { name: 'anmelden' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/sign-in\/$/);
  });

  test('sends a signed-out visitor from a protected route to sign-in', async ({ page }) => {
    await page.goto('/fotos/');

    await expect(page).toHaveURL(/\/auth\/sign-in\/$/);
  });

  test('keeps the session across a reload', async ({ signedInPage }) => {
    await signedInPage.reload();

    await expect(signedInPage).toHaveURL(/\/dashboard\/$/);
    await expect(signedInPage).toHaveTitle('Start – ShareFrame');
  });

  // /auth/sign-out/ is a confirmation page; the session ends on the button click.
  test('signs out after confirming', async ({ signedInPage }) => {
    await signedInPage.goto('/auth/sign-out/');
    await expect(signedInPage.getByText('Bist du dir wirklich sicher, dass du dich abmelden willst?')).toBeVisible();

    await signedInPage.getByRole('button', { name: 'Abmelden', exact: true }).click();

    await expect(signedInPage).toHaveURL(/\/auth\/sign-in\/$/);
    await signedInPage.goto('/fotos/');
    await expect(signedInPage).toHaveURL(/\/auth\/sign-in\/$/);
  });

  test('keeps the session when cancelling the sign-out', async ({ signedInPage }) => {
    await signedInPage.goto('/auth/sign-out/');
    await signedInPage.getByRole('button', { name: 'Abbrechen' }).click();

    await signedInPage.goto('/fotos/');
    await expect(signedInPage).toHaveTitle('Fotos – ShareFrame');
  });
});
