import { expect, test } from '@playwright/test';
import { type Dashboard, loadDashboard, panelByTitle, panelNumber, panelRows, queryPanel } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard, renderedText } from '../support/e2e/grafanaUi';
import { composeContainers, dockerContainerCounts } from '../support/e2e/stack';

// telegraf collects every 30 s, Prometheus scrapes it every 30 s.
const TELEGRAF = { timeout: 120_000, intervals: [5_000] };

// Mirrors the processors.enum mapping in telegraf.conf.
const HEALTH_STATE: Record<string, number> = { healthy: 1, starting: 2, unhealthy: 3 };

test.describe('grafana containers dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;

  const seriesByContainer = async (title: string, refId: string) => {
    const results = await queryPanel(dashboard, panelByTitle(dashboard, title));
    const result = results.find((candidate) => candidate.refId === refId)!;
    return Object.fromEntries(result.series.map((series) => [series.labels.container_name, series]));
  };

  test.beforeAll(async () => {
    dashboard = await loadDashboard('shareframe-containers');
  });

  test('the status table lists every container of this stack and nothing else', async () => {
    const containers = await composeContainers();
    const expected = containers.map((container) => container.Name).sort();

    await expect.poll(async () => Object.keys(await seriesByContainer('Container status', 'A')).sort(), TELEGRAF).toEqual(expected);
    const statuses = await seriesByContainer('Container status', 'A');
    for (const container of containers) {
      expect(statuses[container.Name].labels.container_status, container.Name).toBe(container.State);
    }
  });

  test('health matches the docker healthchecks', async () => {
    const containers = (await composeContainers()).filter((container) => container.Health);
    expect(containers.length).toBeGreaterThan(0);
    const health = await seriesByContainer('Container status', 'B');
    for (const container of containers) {
      expect(health[container.Name]?.last, container.Name).toBe(HEALTH_STATE[container.Health]);
    }
    expect(await panelNumber(dashboard, 'Unhealthy')).toBe(0);
  });

  test('engine counts match docker info', async () => {
    await expect
      .poll(async () => {
        const counts = await dockerContainerCounts();
        return [await panelNumber(dashboard, 'Running'), await panelNumber(dashboard, 'Stopped')].join('/') === `${counts.running}/${counts.stopped}`;
      }, TELEGRAF)
      .toBe(true);
  });

  test('resource and log panels cover the app containers', async () => {
    expect(await panelNumber(dashboard, 'Memory used')).toBeGreaterThan(0);
    const memory = await seriesByContainer('Memory by container', 'A');
    expect(Object.keys(memory)).toEqual(expect.arrayContaining(['backend-test', 'grafana-test', 'nginx-test']));

    const logs = await queryPanel(dashboard, panelByTitle(dashboard, 'Log lines/s by container'));
    const shipping = logs.flatMap((result) => result.series.map((series) => series.labels.container));
    expect(shipping).toEqual(expect.arrayContaining(['backend', 'websockets', 'nginx', 'prometheus']));
    expect(await panelRows(dashboard, 'Container logs')).toBeGreaterThan(0);
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard);
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
    expect(await renderedText(page, 'Unhealthy')).toBe('0');
  });
});
