import { expect, test } from '@playwright/test';
import { type Dashboard, loadDashboard, panelNumber, panelRows } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard, renderedText } from '../support/e2e/grafanaUi';
import { composeExec } from '../support/e2e/stack';

// node-exporter reads the textfiles on every 15 s scrape.
const SCRAPE = { timeout: 90_000, intervals: [5_000] };

/** The metrics the backup script published, as node-exporter's textfile collector reads them. */
const published = async (file: string) => {
  const body = await composeExec('backup', ['cat', `/metrics/${file}`]);
  const value = (name: string, labels = '') => {
    const line = body.split('\n').find((candidate) => candidate.startsWith(`${name}${labels} `));
    if (!line) throw new Error(`${name}${labels} missing from ${file}`);
    return Number(line.split(' ').pop());
  };
  const sum = (name: string) =>
    body
      .split('\n')
      .filter((line) => line.startsWith(`${name}{`) || line.startsWith(`${name} `))
      .reduce((total, line) => total + Number(line.split(' ').pop()), 0);
  return { value, sum };
};

test.describe('grafana backup dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;

  test.beforeAll(async () => {
    dashboard = await loadDashboard('shareframe-backup');
    // The stack already ran one backup on start; the weekly check runs here.
    await composeExec('backup', ['backup.sh', '--check']);
  });

  test('stats show the published run', async () => {
    const backup = await published('backup.prom');

    expect(await panelNumber(dashboard, 'Last run')).toBe(1);
    await expect.poll(() => panelNumber(dashboard, 'Snapshots'), SCRAPE).toBe(backup.value('shareframe_backup_snapshots'));
    expect(await panelNumber(dashboard, 'Duration')).toBe(backup.value('shareframe_backup_duration_seconds'));
    expect(await panelNumber(dashboard, 'Repository size')).toBe(backup.value('shareframe_backup_repo_size_bytes'));
    expect(await panelNumber(dashboard, 'Added last run')).toBe(backup.sum('shareframe_backup_bytes_added'));

    const age = Date.now() / 1000 - backup.value('shareframe_backup_last_success_timestamp_seconds');
    expect(Math.abs((await panelNumber(dashboard, 'Last backup'))! - age)).toBeLessThan(60);
  });

  test('the snapshot count agrees with restic', async () => {
    const snapshots = JSON.parse(await composeExec('backup', ['restic', 'snapshots', '--json', '--no-lock'])) as unknown[];
    expect(await panelNumber(dashboard, 'Snapshots')).toBe(snapshots.length);
  });

  test('the check shows up as recent', async () => {
    await expect.poll(() => panelNumber(dashboard, 'Last check'), SCRAPE).toBeLessThan(120);
    // A range query only has a point once a step lands after the check's first sample.
    await expect.poll(() => panelNumber(dashboard, 'Step results', { refId: 'B' }), SCRAPE).toBe(1);
  });

  test('backup logs are shipped', async () => {
    expect(await panelRows(dashboard, 'Backup logs')).toBeGreaterThan(0);
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard);
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
    const snapshots = JSON.parse(await composeExec('backup', ['restic', 'snapshots', '--json', '--no-lock'])) as unknown[];
    expect(await renderedText(page, 'Last run')).toBe('OK');
    expect(await renderedText(page, 'Snapshots')).toBe(String(snapshots.length));
  });
});
