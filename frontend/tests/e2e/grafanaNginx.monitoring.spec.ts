import { expect, test } from '@playwright/test';
import { type Dashboard, loadDashboard, panelNumber, panelRows, panelSum } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard } from '../support/e2e/grafanaUi';
import { NGINX_URL } from '../support/e2e/stack';

const MARKER = `monitoring-e2e/${Date.now()}`;
const MISSING = `/api/monitoring-e2e-missing-${Date.now()}/`;
const OK_REQUESTS = 4;
const MISSING_REQUESTS = 2;
// The test stack has no frontend container, so the SPA route is a 502.
const SPA_REQUESTS = 1;
const TOTAL = OK_REQUESTS + MISSING_REQUESTS + SPA_REQUESTS;

const get = async (path: string) => (await fetch(`${NGINX_URL}${path}`, { headers: { 'User-Agent': MARKER } })).status;

test.describe('grafana nginx dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;
  let startedAt: number;
  const sinceStart = () => ({ fromMs: startedAt, intervalSecs: 5 });

  test.beforeAll(async () => {
    startedAt = Date.now();
    dashboard = await loadDashboard('shareframe-logs-nginx');
    for (let i = 0; i < OK_REQUESTS; i++) expect(await get('/api/health/')).toBe(200);
    for (let i = 0; i < MISSING_REQUESTS; i++) expect(await get(MISSING)).toBe(404);
    expect(await get('/')).toBe(502);
  });

  test('counts match the requests sent', async () => {
    const range = sinceStart();
    await expect.poll(() => panelNumber(dashboard, 'Requests (range)', range), { timeout: 60_000 }).toBe(TOTAL);
    expect(await panelNumber(dashboard, '5xx (range)', range)).toBe(SPA_REQUESTS);
    expect(await panelNumber(dashboard, '4xx share', range)).toBeCloseTo((MISSING_REQUESTS / TOTAL) * 100, 5);
  });

  test('breakdowns name the marked requests', async () => {
    const range = sinceStart();
    const sums: [string, number, Record<string, string>][] = [
      ['Top user agents', TOTAL, { ua: MARKER }],
      ['Top request URIs', MISSING_REQUESTS, { path: MISSING }],
      ['Top request URIs', OK_REQUESTS, { path: '/api/health/' }],
      ['Top countries', TOTAL, { country: 'unknown' }],
    ];
    for (const [title, expected, labels] of sums) {
      expect(await panelSum(dashboard, title, { ...range, labels }), `${title} ${JSON.stringify(labels)}`).toBe(expected);
    }
    expect(await panelSum(dashboard, 'nginx requests/s by status', { ...range, labels: { status: '404' } })).toBeGreaterThan(0);
  });

  test('timings and logs cover API and static requests', async () => {
    const range = sinceStart();
    for (const title of ['API p95', 'API backend p95', 'Static p95']) {
      expect(await panelNumber(dashboard, title, range), title).not.toBeNull();
    }
    expect(await panelRows(dashboard, 'nginx access log', { ...range, variables: { search: MARKER } })).toBe(TOTAL);
    expect(await panelRows(dashboard, 'nginx error log', range)).toBeGreaterThan(0);
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard, sinceStart());
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
  });
});
