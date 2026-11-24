import { expect, test } from '@playwright/test';
import { exporterSamples, exporterValue } from '../support/e2e/exporter';
import { type Dashboard, loadDashboard, panelByTitle, panelNumber, panelRows, queryPanel } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard } from '../support/e2e/grafanaUi';
import { NGINX_URL } from '../support/e2e/stack';

// rate() needs two django scrapes, one minute apart.
const DJANGO_SCRAPE = { timeout: 200_000, intervals: [10_000] };
const BUSINESS_SCRAPE = { timeout: 330_000, intervals: [10_000] };

const DELIVERY_TASK = 'sent_images.tasks.deliver_due_scheduled_sent_images';

test.describe('grafana backend dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;

  const labelValues = async (title: string, label: string) => {
    const results = await queryPanel(dashboard, panelByTitle(dashboard, title));
    return results.flatMap((result) =>
      result.series.filter((series) => typeof series.last === 'number' && series.last > 0).map((series) => series.labels[label]),
    );
  };

  test.beforeAll(async () => {
    dashboard = await loadDashboard('shareframe-logs');
    for (let i = 0; i < 20; i++) expect((await fetch(`${NGINX_URL}/api/health/`)).ok).toBe(true);
  });

  test('the auth row agrees with the auth dashboard', async () => {
    const auth = await loadDashboard('shareframe-auth');
    for (const title of ['App logins', 'Failed logins', 'Token rejections']) {
      expect(await panelNumber(dashboard, title), title).toBe(await panelNumber(auth, title));
    }
    const sessions = await exporterValue('/metrics/business', 'shareframe_auth_sessions_active');
    await expect.poll(() => panelNumber(dashboard, 'Valid sessions'), BUSINESS_SCRAPE).toBe(sessions);
  });

  test('API panels show the request traffic', async () => {
    // The health endpoint answers 204 without a body.
    await expect.poll(() => labelValues('Requests/s by status', 'status'), DJANGO_SCRAPE).toContain('204');
    expect(await panelNumber(dashboard, 'p50 / p95 latency', { refId: 'B' })).toBeGreaterThan(0);
    expect(await labelValues('Slowest views (p95)', 'view')).not.toEqual([]);
    expect(await labelValues('Database queries', 'process')).toContain('web');
  });

  test('job panels match the exporter', async () => {
    // The task runs every minute, so the panel trails the exporter by up to one scrape.
    const shown = await panelNumber(dashboard, 'Tasks', { refId: 'C', labels: { task: DELIVERY_TASK } });
    const runs = await exporterValue('/metrics', 'shareframe_celery_task_runs_24h', { task: DELIVERY_TASK });
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThanOrEqual(runs!);
    expect(shown).toBeGreaterThanOrEqual(runs! - 2);

    const [queue] = await exporterSamples('/metrics', 'shareframe_celery_queue_length');
    expect(await panelNumber(dashboard, 'Queue length')).toBe(queue.value);
    expect(await panelNumber(dashboard, 'Redis memory', { refId: 'A' })).toBeGreaterThan(0);
  });

  test('log panels read the backend lines', async () => {
    expect(await panelNumber(dashboard, 'Log lines/s')).toBeGreaterThan(0);
    expect(await panelRows(dashboard, 'Backend logs')).toBeGreaterThan(0);
    expect(await labelValues('Backend log lines/s by level', 'level')).toContain('INFO');
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard);
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
  });
});
