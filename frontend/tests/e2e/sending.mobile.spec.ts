import { expect, test } from '../support/e2e/fixtures';
import { expectNoHorizontalScroll } from '../support/e2e/layout';
import { enterSelectionMode, runSpeedDialAction } from '../support/e2e/photos';

test.describe('sending on a phone', () => {
  test('sends a photo to a friend and deactivates it again', async ({ signedInPage: page }) => {
    await test.step('send', async () => {
      await page.goto('/fotos/');
      await expect(page.getByRole('heading', { name: /\d+ Fotos?/ })).toBeVisible({ timeout: 30_000 });
      await enterSelectionMode(page);
      await page.locator('.MuiImageListItem-root img[src^="blob:"]').first().click();
      await runSpeedDialAction(page, 'Ausgewählte Fotos senden');

      const dialog = page.getByRole('dialog');
      // Neither select in this dialog exposes an accessible name; receivers come first.
      await dialog.getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'seed_bob' }).click();
      await page.keyboard.press('Escape');

      const send = page.getByRole('button', { name: /an 1 Empfänger senden/ });
      await send.scrollIntoViewIfNeeded();
      await expect(send).toBeInViewport({ ratio: 1 });
      await expectNoHorizontalScroll(page);
      await send.click();
      await expect(send).toBeHidden({ timeout: 30_000 });
    });

    await test.step('deactivate', async () => {
      await page.goto('/aktivitaeten/');
      await expect(page.getByText(/geteilte/)).toBeVisible({ timeout: 30_000 });
      await expectNoHorizontalScroll(page);

      // Real tiles only: the loading skeletons share the class but take no clicks.
      await page.locator('.MuiImageListItem-root[role="button"]').first().click();
      await expect(page.getByRole('dialog').filter({ hasText: /(Gesendetes|Erhaltenes) Foto/ })).toBeVisible();
      await page.getByRole('button', { name: 'Foto deaktivieren' }).click();
      await page.getByRole('button', { name: 'Deaktivieren', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Deaktivieren', exact: true })).toBeHidden({ timeout: 30_000 });
    });
  });
});
