import path from 'node:path';
import type Konva from 'konva';
import { expect, test } from '../support/e2e/fixtures';

const FIXTURE = path.resolve(import.meta.dirname, '../support/e2e/assets/upload-fixture.jpg');

const photoCount = async (page: import('@playwright/test').Page) => {
  const text = await page.getByRole('heading', { name: /\d+ Fotos?/ }).innerText();
  return Number(text.match(/\d+/)?.[0] ?? 0);
};

const textEditorState = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const stage = (window as unknown as { Konva: typeof Konva }).Konva.stages[0];
    const safe = stage.findOne('.safe-area')!;
    const transformer = stage.findOne('Transformer') as Konva.Transformer;
    const selected = transformer.nodes()[0] as Konva.Label;
    return {
      safe: safe.getClientRect(),
      text: selected.getClientRect(),
      lines: (selected.getText() as unknown as { textArr: unknown[] }).textArr.length,
      widthHandle: transformer.findOne('.middle-right')!.getAbsolutePosition(),
    };
  });

// The dialog scrolls smoothly when its content changes, so the canvas has to settle under the pointer first.
const dragOnCanvas = async (
  page: import('@playwright/test').Page,
  canvas: import('@playwright/test').Locator,
  from: { x: number; y: number },
  to: { x: number; y: number },
) => {
  await canvas.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      canvas.evaluate((element, point) => {
        const rect = element.getBoundingClientRect();
        return document.elementFromPoint(rect.x + point.x, rect.y + point.y) === element;
      }, from),
    )
    .toBe(true);
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + from.x, box.y + from.y);
  await page.mouse.down();
  await page.mouse.move(box.x + to.x, box.y + to.y, { steps: 10 });
  await page.mouse.up();
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
  test('uploads, sends, deactivates, schedules and deletes a photo', async ({ signedInPage: page }) => {
    await page.goto('/fotos/');
    await expect(page).toHaveTitle('Fotos – ShareFrame');
    await expect(page.getByRole('heading', { name: /\d+ Fotos?/ })).toBeVisible({ timeout: 30_000 });
    const before = await photoCount(page);

    await test.step('select and crop', async () => {
      await page.getByRole('button', { name: 'Foto hinzufügen' }).click();
      await expect(page.getByRole('heading', { name: 'Fotos hierher ziehen' })).toBeVisible();

      await page.locator('input[type="file"]').setInputFiles(FIXTURE);
      await expect(page.getByText('upload-fixture.jpg')).toBeVisible();

      await page.getByRole('button', { name: 'Weiter zum Zuschneiden' }).click();
      await page.getByRole('button', { name: 'Zuschneiden & weiter' }).click();
    });

    // jsdom has no canvas, so this is the only place the konva editor and its export really run.
    await test.step('add texts', async () => {
      const selectedText = page.getByRole('group', { name: 'Ausgewählter Text' });
      const canvas = page.getByLabel('Text-Editor').locator('canvas');

      await page.getByRole('button', { name: 'Text hinzufügen' }).click();
      await expect(selectedText.getByRole('textbox', { name: 'Text' })).toHaveValue('Text');
      await selectedText.getByRole('textbox', { name: 'Text' }).fill('Beispieltext');

      // A new text sits in the middle of the photo, the corners stay empty.
      await canvas.click({ position: { x: 5, y: 5 } });
      await expect(selectedText).toBeHidden();
      await canvas.click();
      await expect(selectedText.getByRole('textbox', { name: 'Text' })).toHaveValue('Beispieltext');

      await page.getByRole('button', { name: 'Datum hinzufügen' }).click();
      await expect(selectedText.getByRole('textbox', { name: 'Text' })).toHaveValue(/^\d{2}\.\d{2}\.\d{4}$/);
      await selectedText.getByRole('button', { name: 'Weiß' }).click();
      await selectedText.getByRole('button', { name: 'Hintergrund' }).click();
      await expect(selectedText.getByRole('button', { name: 'Hintergrund' })).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('save, insert and delete a text preset', async () => {
      const selectedText = page.getByRole('group', { name: 'Ausgewählter Text' });
      const presets = page.getByRole('group', { name: 'Vorlagen' });

      await selectedText.getByRole('button', { name: 'Als Vorlage speichern' }).click();
      await presets.getByRole('button', { name: /^\d{2}\.\d{2}\.\d{4}/ }).click();
      await expect(page.getByRole('group', { name: 'Texte' }).getByRole('button')).toHaveCount(3);
      await expect(selectedText.getByRole('button', { name: 'Weiß' })).toHaveAttribute('aria-pressed', 'true');

      await presets.getByRole('img', { name: 'Vorlage löschen' }).click();
      await page.getByRole('dialog', { name: 'Vorlage löschen?' }).getByRole('button', { name: 'Löschen' }).click();
      await expect(presets).toBeHidden();
    });

    await test.step('keep texts inside the passepartout and wrap them', async () => {
      const selectedText = page.getByRole('group', { name: 'Ausgewählter Text' });
      const canvas = page.getByLabel('Text-Editor').locator('canvas');
      // The whole photo has to fit on screen to drag a text into its corner.
      await page.setViewportSize({ width: 1280, height: 1100 });
      const start = await textEditorState(page);

      await dragOnCanvas(page, canvas, { x: start.text.x + start.text.width / 2, y: start.text.y + start.text.height / 2 }, { x: 1, y: 1 });

      const dragged = await textEditorState(page);
      expect(dragged.text.x).toBeLessThan(start.text.x);
      expect(dragged.text.x).toBeGreaterThanOrEqual(dragged.safe.x - 1);
      expect(dragged.text.y).toBeGreaterThanOrEqual(dragged.safe.y - 1);

      await selectedText.getByRole('textbox', { name: 'Text' }).fill('Ein langer Text, der nicht in eine einzige Zeile des Rahmens passt');
      await expect.poll(async () => (await textEditorState(page)).lines).toBeGreaterThan(1);
      const wrapped = await textEditorState(page);
      expect(wrapped.text.x).toBeGreaterThanOrEqual(wrapped.safe.x - 1);
      expect(wrapped.text.x + wrapped.text.width).toBeLessThanOrEqual(wrapped.safe.x + wrapped.safe.width + 1);

      await dragOnCanvas(page, canvas, wrapped.widthHandle, { x: wrapped.widthHandle.x - 80, y: wrapped.widthHandle.y });
      await expect.poll(async () => (await textEditorState(page)).text.width).toBeLessThan(wrapped.text.width);
      await selectedText.getByRole('button', { name: 'Automatisch umbrechen' }).click();
      await expect(selectedText.getByRole('button', { name: 'Automatisch umbrechen' })).toBeHidden();
    });

    await test.step('preview', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.getByRole('button', { name: 'Weiter zur Vorschau' }).click();
      const preview = page.getByRole('img', { name: 'Vorschau von upload-fixture.jpg' });
      await expect(preview).toBeVisible();
      await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    });

    await test.step('upload', async () => {
      await page.getByRole('button', { name: 'Hochladen' }).click();

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

    await test.step('schedule it and send it right away', async () => {
      await page.goto('/fotos/');
      await enterSelectionMode(page);
      await page.locator('img[src^="blob:"]').first().click();
      await runSpeedDialAction(page, 'Ausgewählte Fotos senden');

      await page.getByRole('dialog').getByRole('combobox').first().click();
      await page.getByRole('option', { name: 'seed_bob' }).click();
      await page.keyboard.press('Escape');
      await page.getByRole('switch', { name: 'Zu einem späteren Zeitpunkt senden' }).check();
      await page.getByRole('button', { name: /an 1 Empfänger planen/ }).click();
      await expect(page.getByRole('button', { name: /an 1 Empfänger planen/ })).toBeHidden({
        timeout: 30_000,
      });

      await page.goto('/aktivitaeten/');
      const newest = page.locator('.MuiImageListItem-root').first();
      await expect(newest.getByText('Geplant')).toBeVisible({ timeout: 30_000 });

      await newest.click();
      await runSpeedDialAction(page, 'Vorzeitig, sofort senden');
      await page.getByRole('button', { name: 'Sofort senden bestätigen' }).click();

      await expect(newest.getByText('Aktiv')).toBeVisible({ timeout: 30_000 });
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
