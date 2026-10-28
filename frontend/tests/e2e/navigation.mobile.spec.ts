import { expect, test } from '../support/e2e/fixtures';
import { expectNoHorizontalScroll } from '../support/e2e/layout';

const pages = [
  { name: 'Fotos', url: /\/fotos\/$/ },
  { name: 'Aktivitäten', url: /\/aktivitaeten\/$/ },
  { name: 'Freunde', url: /\/freunde\/$/ },
  { name: 'Bilderrahmen', url: /\/bilderrahmen\/$/ },
  { name: 'Start', url: /\/dashboard\/$/ },
];

test.describe('navigation on a phone', () => {
  test('reaches every main page through the side menu without sideways scrolling', async ({ signedInPage: page }) => {
    await expectNoHorizontalScroll(page);

    for (const { name, url } of pages) {
      await test.step(name, async () => {
        const link = page.getByRole('link', { name, exact: true });
        // The menu button's accessible name is a leftover; it toggles the side menu.
        await page.getByRole('button', { name: 'account of current user' }).click();
        await expect(link).toBeInViewport();

        await link.click();

        await expect(page).toHaveURL(url);
        await expect(page).toHaveTitle(`${name} – ShareFrame`);
        await expect(link).not.toBeInViewport();
        await expectNoHorizontalScroll(page);
      });
    }
  });
});
