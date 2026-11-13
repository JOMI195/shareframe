import { spareFrameClaim } from '../support/e2e/board';
import { dave } from '../support/e2e/credentials';
import { expect, signIn, test } from '../support/e2e/fixtures';

// The alphabet has no 0, so the backend never hands this one out.
const UNKNOWN_CODE = '0000-0000';

// The loading skeletons are Cards too, so frame cards are the ones showing a serial.
const SERIAL = /[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/;

const frameCards = (page: import('@playwright/test').Page) =>
  page.locator('.MuiCard-root').filter({ hasText: SERIAL });

const openFrames = async (page: import('@playwright/test').Page) => {
  await page.goto('/bilderrahmen/');
  await expect(page).toHaveTitle('Bilderrahmen – ShareFrame');
  await expect(frameCards(page).first()).toBeVisible({ timeout: 30_000 });
};

/**
 * The OTP is issued and expired by the backend, and unregistering hands the
 * frame back to the pool — neither is observable against a mock.
 */
test.describe('frames', () => {
  test('lists the seeded frames with their connection state', async ({ signedInPage: page }) => {
    await openFrames(page);

    await expect(frameCards(page)).toHaveCount(2);
    await expect(page.getByText(/Online|Offline/).first()).toBeVisible();
  });

  test('issues a one-time password for a frame', async ({ signedInPage: page }) => {
    await openFrames(page);

    await frameCards(page).first().getByRole('button', { name: 'Einmal-Code anzeigen' }).click();
    const otp = page.locator('input#otp');
    await expect(otp).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Code kopieren' })).toBeDisabled();

    await page.getByRole('button', { name: /Code erstellen/ }).click();

    await expect(otp).toHaveValue(/^\d{6}$/, { timeout: 30_000 });
    await expect(page.getByText(/Noch \d+ Minuten? gültig/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Code kopieren' })).toBeEnabled();
  });

  test('issues a different one-time password on demand', async ({ signedInPage: page }) => {
    await openFrames(page);
    await frameCards(page).first().getByRole('button', { name: 'Einmal-Code anzeigen' }).click();

    await page.getByRole('button', { name: /Code erstellen/ }).click();
    await expect(page.locator('input#otp')).toHaveValue(/^\d{6}$/, { timeout: 30_000 });
    const first = await page.locator('input#otp').inputValue();

    await page.getByRole('button', { name: /Code erstellen/ }).click();

    await expect
      .poll(() => page.locator('input#otp').inputValue(), { timeout: 30_000 })
      .not.toBe(first);
  });

  test('reports a code no frame shows', async ({ signedInPage: page }) => {
    await openFrames(page);

    await page.getByRole('button', { name: 'Bilderrahmen hinzufügen' }).click();
    const dialog = page.getByRole('dialog', { name: 'Bilderrahmen hinzufügen' });
    await dialog.getByRole('textbox', { name: 'Code' }).fill(UNKNOWN_CODE);
    await dialog.getByRole('button', { name: 'Hinzufügen' }).click();

    // The open dialog marks the rest of the page aria-hidden, so the snackbar is
    // matched by its text rather than its role.
    await expect(page.getByText(/Kein Bilderrahmen zeigt diesen Code/)).toBeVisible({ timeout: 30_000 });
    // The dialog stays open so the code can be corrected.
    await expect(dialog.getByRole('textbox', { name: 'Code' })).toBeVisible();
  });

  test('releases a frame after confirming', async ({ signedInPage: page }) => {
    await openFrames(page);
    const serial = (await frameCards(page).first().innerText()).match(SERIAL)?.[0];
    expect(serial).toBeTruthy();

    await frameCards(page).first().getByRole('button', { name: 'Bilderrahmen entfernen' }).click();
    await expect(
      page.getByText('Um ihn wieder hinzuzufügen, starte den Bilderrahmen neu'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Entfernen', exact: true }).click();

    await expect(frameCards(page)).toHaveCount(1, { timeout: 30_000 });
    await page.reload();
    await expect(page.getByText(serial!)).toBeHidden({ timeout: 30_000 });
  });

  // Claims the seeded spare frame, so it uses the account reserved for destructive specs.
  test('adds the frame from the link on its panel', async ({ page, request }) => {
    const { serial, code } = await spareFrameClaim(request);
    await signIn(page, dave);

    await page.goto(`/bilderrahmen/?code=${code}`);
    const dialog = page.getByRole('dialog', { name: 'Bilderrahmen hinzufügen' });
    await expect(dialog.getByRole('textbox', { name: 'Code' })).toHaveValue(`${code.slice(0, 4)}-${code.slice(4)}`);
    await dialog.getByRole('button', { name: 'Hinzufügen' }).click();

    await expect(frameCards(page).filter({ hasText: serial })).toBeVisible({ timeout: 30_000 });
  });
});
