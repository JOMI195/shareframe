import { expect, test } from '../support/e2e/fixtures';
import { expectNoHorizontalScroll } from '../support/e2e/layout';

test.describe('frames on a phone', () => {
  test('opens the register dialog from the panel link with the code on screen', async ({ signedInPage: page }) => {
    await page.goto('/bilderrahmen/?code=K7M2QX9P');

    const dialog = page.getByRole('dialog', { name: 'Bilderrahmen hinzufügen' });
    const code = dialog.getByRole('textbox', { name: 'Code' });
    await expect(code).toHaveValue('K7M2-QX9P');
    await expect(code).toBeInViewport();
    await expect(dialog.getByRole('button', { name: 'Hinzufügen' })).toBeInViewport();
    await expect(page).toHaveURL(/\/bilderrahmen\/$/);
    await expectNoHorizontalScroll(page);

    await dialog.getByRole('button', { name: 'Schließen' }).click();
    await expect(dialog).toBeHidden();
  });
});
