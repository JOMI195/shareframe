import path from 'node:path';
import { expect, test } from '../support/e2e/fixtures';

const FIXTURE = path.resolve(import.meta.dirname, '../support/e2e/assets/upload-fixture.jpg');

const photoCount = async (page: import('@playwright/test').Page) => {
  const text = await page.getByRole('heading', { name: /\d+ Fotos?/ }).innerText();
  return Number(text.match(/\d+/)?.[0] ?? 0);
};

const enterSelectionMode = async (page: import('@playwright/test').Page) => {
  // The floating actions carry icons rather than accessible names.
  await page.locator('button:has([data-testid="HighlightAltIcon"])').click();
  // Selection mode opens behind an intro backdrop that has to be dismissed first.
  await page.locator('.MuiBackdrop-root').first().click();
};

const runSpeedDialAction = async (page: import('@playwright/test').Page, label: string) => {
  await page.getByRole('button', { name: 'Aktionen' }).hover();
  await page.locator('.MuiSpeedDialAction-staticTooltip', { hasText: label }).locator('button').click();
};

/**
 * The one flow that has to touch the real backend: multipart upload with a
 * server side SHA-256 check, variant generation, the friendship rule on
 * send-image, and the soft delete. The stack is fresh and seeded per run.
 */
test.describe('photo lifecycle', () => {
  test('uploads, sends, deactivates and deletes a photo', async ({ signedInPage: page }) => {
    await page.goto('/fotos/');
    await expect(page).toHaveTitle('Fotos – ShareFrame');
    await expect(page.getByRole('heading', { name: /\d+ Fotos?/ })).toBeVisible({ timeout: 30_000 });
    const before = await photoCount(page);

    await test.step('upload', async () => {
      await page.getByRole('button', { name: 'Foto hinzufügen' }).click();
      await expect(page.getByRole('heading', { name: 'Fotos hierher ziehen' })).toBeVisible();

      await page.locator('input[type="file"]').setInputFiles(FIXTURE);
      await expect(page.getByText('upload-fixture.jpg')).toBeVisible();

      await page.getByRole('button', { name: 'Weiter zum Zuschneiden' }).click();
      await page.getByRole('button', { name: 'Zuschneiden & Hochladen' }).click();

      // The dialog closes itself once every selected photo has been uploaded.
      await expect(page.getByRole('button', { name: 'Foto hinzufügen' })).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => photoCount(page), { timeout: 30_000 }).toBe(before + 1);
    });

    await test.step('send it to a friend', async () => {
      await enterSelectionMode(page);
      await page.locator('img[src^="blob:"]').first().click();
      await runSpeedDialAction(page, 'Ausgewählte Fotos senden');

      // Neither select in this dialog exposes an accessible name; receivers come first.
      await page.getByRole('dialog').getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'seed_bob' }).click();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /an 1 Empfänger senden/ }).click();

      await expect(page.getByRole('button', { name: /an 1 Empfänger senden/ })).toBeHidden({
        timeout: 30_000,
      });
    });

    await test.step('deactivate it again', async () => {
      await page.goto('/aktivitaeten/');
      await expect(page.getByText(/geteilte/)).toBeVisible({ timeout: 30_000 });

      await page.locator('.MuiImageListItem-root').first().click();
      await expect(page.getByRole('dialog').filter({ hasText: 'Gesendetes Foto' })).toBeVisible();
      await runSpeedDialAction(page, 'Foto deaktivieren');
      await page.getByRole('button', { name: 'Deaktivieren bestätigen' }).click();

      await expect(page.getByRole('button', { name: 'Deaktivieren bestätigen' })).toBeHidden({
        timeout: 30_000,
      });
    });

    await test.step('delete it', async () => {
      await page.goto('/fotos/');
      await expect.poll(() => photoCount(page), { timeout: 30_000 }).toBe(before + 1);

      await enterSelectionMode(page);
      await page.locator('img[src^="blob:"]').first().click();
      await runSpeedDialAction(page, 'Ausgewählte Fotos löschen');
      await page.getByRole('button', { name: 'Löschen bestätigen' }).click();

      await expect.poll(() => photoCount(page), { timeout: 30_000 }).toBe(before);
    });
  });

  test('rejects a file the picker should not have offered', async ({ signedInPage: page }) => {
    await page.goto('/fotos/');
    await page.getByRole('button', { name: 'Foto hinzufügen' }).click();

    // setInputFiles ignores the accept attribute, which is exactly what mobile
    // pickers and drag-and-drop do, so the app's own validation has to catch it.
    await page.locator('input[type="file"]').setInputFiles({
      name: 'notizen.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 not really a pdf'),
    });

    await expect(page.getByText(/Falsches Dateiformat/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Weiter zum Zuschneiden' })).toBeDisabled();
  });
});
