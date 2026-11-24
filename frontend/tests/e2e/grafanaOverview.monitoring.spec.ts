import { expect, test } from '@playwright/test';
import { exporterSamples, exporterValue } from '../support/e2e/exporter';
import { type Dashboard, loadDashboard, panelNumber } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard, renderedText } from '../support/e2e/grafanaUi';

// The slowest source behind these stats is the four-minute business scrape.
const SCRAPE = { timeout: 330_000, intervals: [10_000] };

const business = (name: string, labels?: Record<string, string>) => exporterValue('/metrics/business', name, labels);

test.describe('grafana overview dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;

  test.beforeAll(async () => {
    dashboard = await loadDashboard('shareframe-overview');
  });

  test('health stats show a healthy stack', async () => {
    expect(await panelNumber(dashboard, 'Backend')).toBe(1);
    expect(await panelNumber(dashboard, 'Targets down')).toBe(0);
    expect(await panelNumber(dashboard, 'Unhealthy containers')).toBe(0);
    expect(await panelNumber(dashboard, 'Redis evictions 24h')).toBe(0);
  });

  test('job and backup ages are recent', async () => {
    // Delivery runs every minute; the backup ran once when the stack started.
    expect(await panelNumber(dashboard, 'Delivery job')).toBeLessThan(180);
    const backupAge = await panelNumber(dashboard, 'Backup');
    expect(backupAge).toBeGreaterThan(0);
    expect(backupAge).toBeLessThan(3600);
  });

  test('host stats are percentages', async () => {
    for (const title of ['Host CPU', 'Host memory', 'Disk used']) {
      const value = await panelNumber(dashboard, title);
      expect(value, title).toBeGreaterThan(0);
      expect(value, title).toBeLessThanOrEqual(100);
    }
  });

  test('fleet and task stats match the exporter', async () => {
    const reporting = (await exporterSamples('/metrics', 'shareframe_frame_build_info')).length;
    const unhealthy = (await exporterSamples('/metrics', 'shareframe_frame_health', { check: 'overall' })).filter(
      (sample) => sample.labels.status !== 'ok',
    ).length;
    const failures = (await exporterSamples('/metrics', 'shareframe_celery_task_failures_24h')).reduce(
      (sum, sample) => sum + sample.value,
      0,
    );

    await expect.poll(() => panelNumber(dashboard, 'Frames online', { refId: 'A' }), SCRAPE).toBe(reporting);
    await expect.poll(() => panelNumber(dashboard, 'Frames unhealthy'), SCRAPE).toBe(unhealthy);
    await expect.poll(() => panelNumber(dashboard, 'Task failures 24h'), SCRAPE).toBe(failures);
  });

  test('usage stats match the exporter', async () => {
    const cases: [string, string, Record<string, string>?][] = [
      ['Active users 7d', 'shareframe_users_active', { window: '7d' }],
      ['Uploads 24h', 'shareframe_images_uploaded_24h'],
      ['Sent 24h', 'shareframe_sent_images_sent_24h'],
    ];
    for (const [title, metric, labels] of cases) {
      const expected = await business(metric, labels);
      await expect.poll(() => panelNumber(dashboard, title), { ...SCRAPE, message: title }).toBe(expected);
    }
    const registered = await business('shareframe_frames_registered');
    await expect.poll(() => panelNumber(dashboard, 'Frames online', { refId: 'B', panelType: 'timeseries' }), SCRAPE).toBe(registered);
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard);
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
    expect(await renderedText(page, 'Backend')).toBe('UP');
    expect(await renderedText(page, 'Targets down')).toBe('0');
  });
});
