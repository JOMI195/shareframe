import path from 'node:path';
import type { Page } from '@playwright/test';

export const FIXTURE = path.resolve(import.meta.dirname, 'assets/upload-fixture.jpg');

export const photoCount = async (page: Page) => {
  const text = await page.getByRole('heading', { name: /\d+ Fotos?/ }).innerText();
  return Number(text.match(/\d+/)?.[0] ?? 0);
};

export const enterSelectionMode = async (page: Page) => {
  // The floating actions carry icons rather than accessible names.
  await page.locator('button:has([data-testid="HighlightAltIcon"])').click();
  await page.getByText('Tippe Fotos an, um sie auszuwählen').waitFor();
};

export const runSpeedDialAction = async (page: Page, label: string) => {
  await page.getByRole('button', { name: 'Aktionen' }).hover();
  await page.locator('.MuiSpeedDialAction-staticTooltip', { hasText: label }).locator('button').click();
};
