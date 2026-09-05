import { expect, test } from '../support/e2e/fixtures';

// Matches the register dialog's own format. The backend derives serials as four
// groups of four instead, so no real frame can be registered through this form —
// see README.tests.md.
const UNKNOWN_SERIAL = 'ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ';

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

    await frameCards(page).first().getByRole('button', { name: 'generate otp' }).click();
    const otp = page.locator('input#otp');
    await expect(otp).toHaveValue('');
    await expect(page.getByRole('button', { name: 'copy otp' })).toBeDisabled();

    await page.getByRole('button', { name: 'Generieren' }).click();

    await expect(otp).toHaveValue(/^\d{6}$/, { timeout: 30_000 });
    await expect(page.getByText(/gültig für: \d+ Minuten/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'copy otp' })).toBeEnabled();
  });

  test('issues a different one-time password on demand', async ({ signedInPage: page }) => {
    await openFrames(page);
    await frameCards(page).first().getByRole('button', { name: 'generate otp' }).click();

    await page.getByRole('button', { name: 'Generieren' }).click();
    await expect(page.locator('input#otp')).toHaveValue(/^\d{6}$/, { timeout: 30_000 });
    const first = await page.locator('input#otp').inputValue();

    await page.getByRole('button', { name: 'Generieren' }).click();

    await expect
      .poll(() => page.locator('input#otp').inputValue(), { timeout: 30_000 })
      .not.toBe(first);
  });

  test('reports an unknown serial number', async ({ signedInPage: page }) => {
    await openFrames(page);

    await page.getByRole('button', { name: 'Bilderrahmen hinzufügen' }).click();
    await page.getByLabel('Seriennummer').fill(UNKNOWN_SERIAL);
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    // The open dialog marks the rest of the page aria-hidden, so the snackbar is
    // matched by its text rather than its role.
    await expect(page.getByText('Bilderrahmen registrieren fehlgeschlagen')).toBeVisible({
      timeout: 30_000,
    });
    // The dialog stays open so the serial can be corrected.
    await expect(page.getByLabel('Seriennummer')).toBeVisible();
  });

  test('releases a frame after confirming', async ({ signedInPage: page }) => {
    await openFrames(page);
    const serial = (await frameCards(page).first().innerText()).match(SERIAL)?.[0];
    expect(serial).toBeTruthy();

    await frameCards(page).first().getByRole('button', { name: 'delete' }).click();
    await expect(
      page.getByText('Du kannst den Bilderrahmen jederzeit wieder mit seiner Seriennummer hinzufügen'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Löschen bestätigen' }).click();

    await expect(frameCards(page)).toHaveCount(1, { timeout: 30_000 });
    await page.reload();
    await expect(page.getByText(serial!)).toBeHidden({ timeout: 30_000 });
  });
});
