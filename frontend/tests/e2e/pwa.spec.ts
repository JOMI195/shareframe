import { readFileSync } from 'node:fs';
import { Page } from '@playwright/test';
import { alice } from '../support/e2e/credentials';
import { expect, signIn, test } from '../support/e2e/fixtures';
import { FIXTURE, photoCount } from '../support/e2e/photos';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const INSTALL_HINT = 'Installiere ShareFrame als App für den schnellen Zugriff.';

type InstallWindow = Window & { installPrompted?: boolean };

// The stack serves vite in dev mode, where main.tsx skips the registration.
const registerServiceWorker = (page: Page) =>
  page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
  });

// What Android does once a photo is shared to the installed app: it reads
// share_target from the manifest and navigates there with a multipart POST.
const shareFromGallery = async (page: Page, files: Parameters<Page['setInputFiles']>[1] = FIXTURE) => {
  const manifest = await (await page.request.get('/site.webmanifest')).json();
  const { action, method, enctype, params } = manifest.share_target;

  await page.evaluate(({ action, method, enctype, field }) => {
    const form = document.createElement('form');
    Object.assign(form, { id: 'os-share', action, method, enctype });
    const input = document.createElement('input');
    Object.assign(input, { type: 'file', name: field });
    form.append(input);
    document.body.append(form);
  }, { action, method, enctype, field: params.files[0].name });

  await page.locator('#os-share input').setInputFiles(files);
  await page.evaluate(() => (document.getElementById('os-share') as HTMLFormElement).submit());
};

test.describe('share target', () => {
  test('a photo shared from the gallery opens the upload dialog and uploads', async ({ signedInPage: page }) => {
    await page.goto('/fotos/');
    await expect(page.getByRole('heading', { name: /\d+ Fotos?/ })).toBeVisible({ timeout: 30_000 });
    const before = await photoCount(page);

    await registerServiceWorker(page);
    await shareFromGallery(page);

    await expect(page).toHaveURL(/\/fotos\/$/);
    await expect(page.getByRole('button', { name: 'upload-fixture.jpg', exact: true })).toBeVisible();
    // A share is taken exactly once.
    expect(await page.evaluate(() => caches.has('share-target'))).toBe(false);

    await page.getByRole('button', { name: 'Weiter zur Vorschau' }).click();
    await page.getByRole('button', { name: 'Hochladen' }).click();
    await page.getByRole('button', { name: 'Später' }).click();

    await expect(page.getByRole('button', { name: 'Foto hinzufügen' })).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => photoCount(page), { timeout: 30_000 }).toBe(before + 1);
  });

  // Gallery apps do not always report an exact image type; the dialog checks the format.
  test('a photo with an unusual type still reaches the upload dialog', async ({ signedInPage: page }) => {
    await page.goto('/fotos/');
    await registerServiceWorker(page);
    await shareFromGallery(page, {
      name: 'upload-fixture.jpg',
      mimeType: 'application/octet-stream',
      buffer: readFileSync(FIXTURE),
    });

    await expect(page).toHaveURL(/\/fotos\/$/);
    await expect(page.getByRole('button', { name: 'upload-fixture.jpg', exact: true })).toBeVisible();
  });

  // Chrome on Android sometimes delivers the share without its files.
  test('a share without files opens the upload dialog with a hint', async ({ signedInPage: page }) => {
    await page.goto('/fotos/');
    await registerServiceWorker(page);
    await shareFromGallery(page, []);

    await expect(page).toHaveURL(/\/fotos\/$/);
    await expect(page.getByText('Das geteilte Foto ist nicht angekommen. Wähle es hier direkt aus.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fotos auswählen' })).toBeVisible();
  });

  test('a photo shared while signed out is waiting after the sign-in', async ({ page }) => {
    await page.goto('/auth/sign-in/');
    await registerServiceWorker(page);
    await shareFromGallery(page);
    await expect(page).toHaveURL(/\/auth\/sign-in\/$/);

    await page.getByRole('textbox', { name: 'E-Mail-Adresse' }).fill(alice.email);
    await page.getByLabel('Passwort', { exact: true }).fill(alice.password);
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page).toHaveURL(/\/fotos\/$/);
    // The changelog and the upload dialog open in either order, and whichever comes second
    // hides the other from the accessibility tree. Nothing is clicked here, so it may stay.
    await expect(page.getByRole('button', { name: 'upload-fixture.jpg', exact: true })).toBeVisible();
  });
});

test.describe('install on iPhone', () => {
  test.use({ userAgent: IPHONE_UA });

  test('the hint shows the home screen steps once', async ({ page }) => {
    await signIn(page);

    const hint = page.getByText(INSTALL_HINT);
    await expect(hint).toBeVisible();
    await page.getByRole('button', { name: 'Installieren', exact: true }).click();
    await expect(page.getByText('Wähle „Zum Home-Bildschirm“.')).toBeVisible();
    await page.getByRole('button', { name: 'Verstanden' }).click();
    await expect(hint).toBeHidden();

    await page.goto('/settings/app/');
    await page.getByRole('tab', { name: 'App', exact: true }).click();
    await expect(page.getByRole('button', { name: 'App installieren' })).toBeVisible();
    await expect(hint).toBeHidden();
  });
});

test.describe('install in Chrome', () => {
  test('the settings run the browser install prompt', async ({ signedInPage: page }) => {
    await page.goto('/settings/app/');
    await page.getByRole('tab', { name: 'App', exact: true }).click();

    // Chromium decides on its own whether to fire this, so the test fires it.
    await page.evaluate(() => {
      const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt: async () => {
          (window as InstallWindow).installPrompted = true;
        },
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      });
      window.dispatchEvent(event);
    });

    await page.getByRole('button', { name: 'App installieren' }).click();
    await expect.poll(() => page.evaluate(() => (window as InstallWindow).installPrompted)).toBe(true);
  });
});
