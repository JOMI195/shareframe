import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../support/e2e/fixtures';
import { boxOf } from '../support/e2e/layout';
import { FIXTURE, enterSelectionMode, photoCount, runSpeedDialAction } from '../support/e2e/photos';

const tab = (page: Page, name: 'Zuschnitt' | 'Anpassen' | 'Text') => page.getByRole('tab', { name });

const openWithPhoto = async (page: Page) => {
  await page.getByRole('button', { name: 'Foto hinzufügen' }).click();
  await expect(page.getByRole('heading', { name: 'Welche Fotos möchtest du hochladen?' })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(FIXTURE);
  await expect(page.getByRole('slider', { name: 'Zoom' })).toBeVisible();
};

const expectSameBox = async (actual: Locator, expected: { x: number; y: number; width: number; height: number }) => {
  await expect.poll(async () => {
    const box = await boxOf(actual);
    return Math.max(...(['x', 'y', 'width', 'height'] as const).map((key) => Math.abs(box[key] - expected[key])));
  // Pixel 7 lays out at a fractional device pixel ratio, so boxes round to sub-pixel differences.
  }).toBeLessThanOrEqual(1.5);
};

// MUI keeps the real range input as a clipped 1px element; the track around it is what shows.
const sliderTrack = (page: Page, name: string) =>
  page.locator('.MuiSlider-root', { has: page.getByRole('slider', { name }) });

// The frame around the photo; light mode gives it a 1px border inside which the photo sits.
const frameOf = (page: Page) => page.getByRole('img', { name: 'Vorschau von upload-fixture.jpg' }).locator('..');

const imageTransform = (page: Page) =>
  page.locator('.reactEasyCrop_Image').evaluate((image) => {
    const [x, y] = [...image.style.transform.matchAll(/(-?[\d.]+)px/g)].map((match) => Number(match[1]));
    return { x, y };
  });

test.describe('upload dialog on a phone', () => {
  test('shows the photo and all crop tools at once, at one frame size throughout', async ({ signedInPage: page }) => {
    await test.step('start screen offers the camera', async () => {
      await page.goto('/fotos/');
      await page.getByRole('button', { name: 'Foto hinzufügen' }).click();
      await expect(page.getByRole('button', { name: 'Fotos auswählen' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Foto aufnehmen' })).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    });

    const cropArea = page.locator('.reactEasyCrop_CropArea');
    let frame: { x: number; y: number; width: number; height: number };

    await test.step('crop tools fit next to the photo without scrolling', async () => {
      await expect(cropArea).toBeVisible();
      for (const control of [
        cropArea,
        sliderTrack(page, 'Zoom'),
        sliderTrack(page, 'Rotation'),
        page.getByRole('button', { name: 'Nach links verschieben' }),
        page.getByRole('button', { name: 'Nach oben verschieben' }),
        page.getByRole('button', { name: 'Nach unten verschieben' }),
        page.getByRole('button', { name: 'Nach rechts verschieben' }),
        page.getByRole('button', { name: 'Zentrieren' }),
        page.getByRole('button', { name: 'Zurücksetzen' }),
        page.getByRole('button', { name: 'Weiter zur Vorschau' }),
      ]) {
        await expect(control).toBeInViewport({ ratio: 1 });
      }
      frame = await boxOf(cropArea);
    });

    await test.step('adjusting shows the frame at the crop size', async () => {
      await tab(page, 'Anpassen').click();
      await expectSameBox(frameOf(page), frame);
    });

    await test.step('the text editor shows the frame at the crop size', async () => {
      await tab(page, 'Text').click();
      await expectSameBox(page.getByLabel('Text-Editor'), frame);
    });

    await test.step('the preview shows the frame at the crop size', async () => {
      await page.getByRole('button', { name: 'Weiter zur Vorschau' }).click();
      await expectSameBox(frameOf(page), frame);
    });
  });

  test('keeps the crop across tools and uploads a photo with a text', async ({ signedInPage: page }) => {
    await page.goto('/fotos/');
    await expect(page.getByRole('heading', { name: /\d+ Fotos?/ })).toBeVisible({ timeout: 30_000 });
    // The open dialog hides the gallery heading from the accessibility tree.
    const before = await photoCount(page);
    await openWithPhoto(page);

    await test.step('crop survives switching tools', async () => {
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: 'Vergrößern' }).click();
      }
      // Far enough that a crop box resized after mounting would visibly shift the kept position.
      for (let i = 0; i < 8; i++) {
        await page.getByRole('button', { name: 'Nach rechts verschieben' }).click();
        await page.getByRole('button', { name: 'Nach unten verschieben' }).click();
      }
      const zoom = await page.getByRole('slider', { name: 'Zoom' }).inputValue();
      const position = await imageTransform(page);

      await tab(page, 'Anpassen').click();
      await expect(page.getByRole('slider', { name: 'Kontrast' })).toBeVisible();
      await tab(page, 'Zuschnitt').click();

      await expect(page.getByRole('slider', { name: 'Zoom' })).toHaveValue(zoom);
      await expect.poll(async () => {
        const now = await imageTransform(page);
        return Math.max(Math.abs(now.x - position.x), Math.abs(now.y - position.y));
      }).toBeLessThanOrEqual(1);
    });

    await test.step('a text added earlier is burned in from the crop tool', async () => {
      await tab(page, 'Text').click();
      await page.getByRole('button', { name: 'Text hinzufügen' }).click();
      await tab(page, 'Zuschnitt').click();
      await page.getByRole('button', { name: 'Weiter zur Vorschau' }).click();

      await expect(page.getByRole('img', { name: 'Vorschau von upload-fixture.jpg' })).toBeVisible();
      // On phones the header arrow is the only way back, and it replaces closing.
      await expect(page.getByRole('button', { name: 'Zurück zum Bearbeiten' })).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Schließen' })).toHaveCount(0);
    });

    await test.step('upload and clean up', async () => {
      await page.getByRole('button', { name: 'Hochladen' }).click();
      await page.getByRole('button', { name: 'Später' }).click();
      await expect(page.getByRole('button', { name: 'Foto hinzufügen' })).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => photoCount(page), { timeout: 30_000 }).toBe(before + 1);

      await enterSelectionMode(page);
      await page.locator('.MuiImageListItem-root img[src^="blob:"]').first().click();
      await runSpeedDialAction(page, 'Ausgewählte Fotos löschen');
      await page.getByRole('button', { name: 'Löschen', exact: true }).click();
      await expect.poll(() => photoCount(page), { timeout: 30_000 }).toBe(before);
    });
  });
});
