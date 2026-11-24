import { expect, test } from '@playwright/test';
import { exporterValue, nodeExporterValue } from '../support/e2e/exporter';
import { type Dashboard, loadDashboard, panelNumber } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard } from '../support/e2e/grafanaUi';

const BUSINESS_SCRAPE = { timeout: 330_000, intervals: [10_000] };

test.describe('grafana host dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;

  test.beforeAll(async () => {
    dashboard = await loadDashboard('shareframe-host');
  });

  test('uptime and memory follow the node-exporter samples', async () => {
    const boot = await nodeExporterValue('node_boot_time_seconds');
    const uptime = Date.now() / 1000 - boot!;
    // The panel trails by up to one 15 s scrape.
    expect(Math.abs((await panelNumber(dashboard, 'Uptime'))! - uptime)).toBeLessThan(60);

    const available = await nodeExporterValue('node_memory_MemAvailable_bytes');
    const total = await nodeExporterValue('node_memory_MemTotal_bytes');
    const used = (1 - available! / total!) * 100;
    expect(Math.abs((await panelNumber(dashboard, 'Memory'))! - used)).toBeLessThan(5);
  });

  test('gauges are percentages and rates are positive', async () => {
    for (const title of ['CPU', 'Memory', 'Disk used (worst)']) {
      const value = await panelNumber(dashboard, title);
      expect(value, title).toBeGreaterThan(0);
      expect(value, title).toBeLessThanOrEqual(100);
    }
    for (const title of ['Disk free (least)', 'Network']) {
      expect(await panelNumber(dashboard, title), title).toBeGreaterThan(0);
    }
  });

  test('database and image storage match the business exporter', async () => {
    const cases: [string, string, () => Promise<number | null>][] = [
      ['Database size', 'A', () => exporterValue('/metrics/business', 'shareframe_database_size_bytes')],
      ['Image storage', 'C', () => exporterValue('/metrics/business', 'shareframe_images_marked_deleted_total')],
      [
        'Image storage',
        'B',
        async () =>
          (await exporterValue('/metrics/business', 'shareframe_images_total'))! +
          (await exporterValue('/metrics/business', 'shareframe_images_marked_deleted_total'))!,
      ],
    ];
    for (const [title, refId, expected] of cases) {
      const value = await expected();
      await expect.poll(() => panelNumber(dashboard, title, { refId }), { ...BUSINESS_SCRAPE, message: `${title} ${refId}` }).toBe(value);
    }
    expect(await panelNumber(dashboard, 'Image storage', { refId: 'A' })).toBeGreaterThan(0);
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard);
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
  });
});
