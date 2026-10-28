import { bob } from '../support/e2e/credentials';
import { expect, test } from '../support/e2e/fixtures';
import { boxOf, expectNoHorizontalScroll } from '../support/e2e/layout';

test.describe('friendships on a phone', () => {
  test('shows a friend within the screen and opens the request dialog', async ({ signedInPage: page }) => {
    await page.goto('/freunde/');
    await expect(page.getByRole('tab', { name: 'Freunde' })).toBeVisible({ timeout: 30_000 });

    const friend = page.locator('.MuiCard-root', { hasText: bob.username });
    await expect(friend.locator('img')).toHaveAttribute('src', /^blob:/, { timeout: 30_000 });
    const card = await boxOf(friend);
    expect(card.x).toBeGreaterThanOrEqual(0);
    expect(card.x + card.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expectNoHorizontalScroll(page);

    await page.getByRole('button', { name: 'Freundschafsanfrage' }).click();
    await expect(page.getByLabel('Freundschaftscode')).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Hinzufügen' })).toBeInViewport({ ratio: 1 });

    await page.keyboard.press('Escape');
    await expect(page.getByLabel('Freundschaftscode')).toBeHidden();
  });
});
