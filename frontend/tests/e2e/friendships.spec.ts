import { carol, dave, mallory } from '../support/e2e/credentials';
import { expect, test } from '../support/e2e/fixtures';

const requestsTab = (page: import('@playwright/test').Page) =>
  page.getByRole('tab', { name: /Anfragen/ });

const openFriendships = async (page: import('@playwright/test').Page) => {
  await page.goto('/freunde/');
  await expect(page.getByRole('tab', { name: 'Freunde' })).toBeVisible({ timeout: 30_000 });
};

/**
 * The rules being exercised here live in the backend: who may be found by their
 * friend code, and what an accepted request does to both sides of the list.
 */
test.describe('friendships', () => {
  test('accepts an incoming request and shows the new friend', async ({ signedInPage: page }) => {
    await openFriendships(page);
    await expect(requestsTab(page)).toContainText('1');

    await requestsTab(page).click();
    await expect(page.getByText(dave.username)).toBeVisible();

    await page.getByRole('button', { name: 'Anfrage annehmen' }).click();

    await expect(page.getByText('Keine Freundschaftsanfragen vorhanden')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('tab', { name: 'Freunde' }).click();
    await expect(page.getByText(dave.username)).toBeVisible();
  });

  test('refuses a friend code that is not searchable', async ({ signedInPage: page }) => {
    await openFriendships(page);

    await page.getByRole('button', { name: 'Freundschafsanfrage' }).click();
    await page.getByLabel('Freundschaftscode').fill(mallory.code);
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    // The open dialog marks the rest of the page aria-hidden, so the snackbar is
    // matched by its text rather than its role.
    await expect(page.getByText('Freundschaftsanfrage fehlgeschlagen. Schau mal ob die Anfrage nicht schon gestellt wurde.')).toBeVisible({ timeout: 30_000 });
    // The dialog stays open so the code can be corrected.
    await expect(page.getByLabel('Freundschaftscode')).toBeVisible();
  });

  test('rejects a code that does not belong to anyone', async ({ signedInPage: page }) => {
    await openFriendships(page);

    await page.getByRole('button', { name: 'Freundschafsanfrage' }).click();
    await page.getByLabel('Freundschaftscode').fill('ZZZZ9999');
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    await expect(page.getByText('Freundschaftsanfrage fehlgeschlagen. Schau mal ob die Anfrage nicht schon gestellt wurde.')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel('Freundschaftscode')).toBeVisible();
  });

  test('ends a friendship after confirming', async ({ signedInPage: page }) => {
    await openFriendships(page);

    const friend = page.locator('.MuiCard-root', { hasText: carol.username });
    await expect(friend).toBeVisible({ timeout: 30_000 });
    await friend.getByRole('button', { name: 'delete' }).click();

    await expect(
      page.getByText('Die Freundschaft kann mit einer Freundschaftanfrage jederzeit wieder hergestellt werden.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Beenden bestätigen' }).click();

    await expect(friend).toBeHidden({ timeout: 30_000 });
    await page.reload();
    await expect(page.getByText(carol.username)).toBeHidden({ timeout: 30_000 });
  });
});
