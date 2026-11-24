import { expect, type Page } from '@playwright/test';
import { type Dashboard, GRAFANA_URL, grafanaAdmin, panelsOf } from './grafana';
import { EXPECTED_EMPTY } from './grafanaExpectedEmpty';

/** Basic auth on every request, so the UI checks never create a session that counts as a Grafana sign-in. */
export const grafanaAuthHeaders = {
  Authorization: `Basic ${Buffer.from(`${grafanaAdmin.user}:${grafanaAdmin.password}`).toString('base64')}`,
};

export const panelSection = (page: Page, title: string) => page.getByTestId(`data-testid Panel header ${title}`).first();

/** Loads the dashboard tall enough that every lazily rendered panel queries at once. */
export const openDashboard = async (page: Page, uid: string, query: Record<string, string> = {}) => {
  await page.setViewportSize({ width: 1600, height: 9000 });
  const params = new URLSearchParams({ from: 'now-1h', to: 'now', kiosk: '', ...query });
  await page.goto(`${GRAFANA_URL}/d/${uid}?${params}`);
  await expect(page.getByTestId(/^data-testid Panel header /).first()).toBeVisible();
  await page.waitForLoadState('networkidle');
};

/** No panel shows an error, and only the allowlisted ones show "No data". */
export const expectDashboardRenders = async (page: Page, dashboard: Dashboard) => {
  const allowed = EXPECTED_EMPTY[dashboard.uid] ?? {};
  const titles = [...new Set(panelsOf(dashboard).filter((panel) => panel.targets?.length).map((panel) => panel.title))];
  const problems: string[] = [];

  for (const title of titles) {
    const sections = page.getByTestId(`data-testid Panel header ${title}`);
    if ((await sections.count()) === 0) problems.push(`${title}: not rendered`);
    for (const section of await sections.all()) {
      const text = await section.innerText();
      if (/No data/.test(text) && !(title in allowed)) problems.push(`${title}: No data`);
      if (await section.getByTestId(/Panel status error/).count()) problems.push(`${title}: error`);
    }
  }

  expect(problems).toEqual([]);
};

/** The value a stat or gauge panel renders, with its unit, as a user reads it. */
export const renderedText = async (page: Page, title: string) =>
  (await panelSection(page, title).innerText()).replace(title, '').trim();
