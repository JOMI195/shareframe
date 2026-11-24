import { expect, test } from '@playwright/test';
import { seedFrame } from '../support/e2e/board';
import { closeConnection, rejectedConnection, runFrameSession, sendHeartbeat } from '../support/e2e/frameSim';
import { type Dashboard, loadDashboard, panelNumber, panelRows, panelSum } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard, renderedText } from '../support/e2e/grafanaUi';
import { composeExec, runInBackend } from '../support/e2e/stack';

const frameA = seedFrame('seed-frame-main');
const frameB = seedFrame('seed-frame-office');

const BUILD = { version: '7.9.1', app_sha: 'e2e0app', os_sha: 'e2e0os', kernel: '6.6.99-e2e', boot_slot: 'B', sd_card: 'e2e-sd-32g' };
const EVENT = 'e2e monitoring display refresh';

// Distinct values, so a panel reading the wrong field cannot pass by accident.
const telemetryA = {
  ...BUILD,
  local_ip_address: '192.168.0.77',
  health_state: 'ok',
  display_screen: 'slideshow',
  wifi_mode: 'connected',
  update_phase: 'idle',
  websocket_running: true,
  display_running: true,
  dashboard_running: true,
  update_running: true,
  uptime_seconds: 7200,
  boot_count: 40,
  cpu_temp_celsius: 51.5,
  cpu_usage_percent: 23.5,
  cpu_freq_mhz: 1000,
  load_1: 0.5,
  load_5: 0.4,
  load_15: 0.3,
  ram_total_bytes: 400_000_000,
  ram_available_bytes: 100_000_000,
  storage_data_total_bytes: 4_000_000_000,
  storage_data_free_bytes: 1_000_000_000,
  data_written_kb: 1000,
  crash_count: 2,
  unclean_resets: 1,
  uv_events: 3,
  temp_peak_celsius: 61.5,
  wlan_signal_dbm: -55,
  image_count: 12,
  display_epd_image_refresh_total: 30,
  display_epd_refresh_fail_total: 1,
  display_epd_poweron_fail_total: 4,
  display_epd_last_refresh_ms: 4200,
  display_consecutive_failures: 5,
  proc_display_heap_bytes: 1_048_576,
  proc_display_rss_bytes: 8_388_608,
  proc_display_threads: 6,
  proc_display_fds: 21,
  events: [{ seq: 1, time: new Date().toISOString(), source: 'display', message: EVENT }],
};

const telemetryB = { ...telemetryA, health_state: 'degraded', display_running: false, events: [] };

const SCRAPE = { timeout: 180_000, intervals: [5_000] };

const groundTruth = async () => {
  const out = await runInBackend(
    [
      'import json',
      'from datetime import timedelta',
      'from django.utils import timezone',
      'from frames.models import Frame',
      'fresh = timezone.now() - timedelta(seconds=900)',
      'print("TRUTH" + json.dumps({"registered": Frame.objects.count(), "reporting": Frame.objects.filter(last_heartbeat__gte=fresh).count()}))',
    ].join('\n'),
  );
  return JSON.parse(out.match(/TRUTH(\{.*\})/)![1]) as { registered: number; reporting: number };
};

test.describe('grafana frames dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;
  let startedAt: number;
  const onlyA = { variables: { frame: frameA.serial } };
  const onlyB = { variables: { frame: frameB.serial } };

  test.beforeAll(async () => {
    startedAt = Date.now();
    dashboard = await loadDashboard('shareframe-frames');

    const session = runFrameSession(frameA.seed_b64, 20, { ...telemetryA, serial_number: frameA.serial });
    await sendHeartbeat(frameB.seed_b64, frameB.serial, telemetryB);
    expect(await rejectedConnection()).toBe(403);
    expect(await closeConnection(frameB.seed_b64)).toBe(4002);
    // The reaper runs every 15 minutes; run it once so its panel does not depend on timing.
    await composeExec('backend', ['python', 'manage.py', 'run_celery_delete_inactive_connections_task']);
    const stats = await session;
    expect(stats.errors).toEqual([]);
    expect(stats.heartbeats.ok).toBe(1);

    // The range panels need the first values scraped before the second heartbeat lands.
    await expect.poll(() => panelNumber(dashboard, 'Boot count', onlyA), SCRAPE).toBe(40);
    await sendHeartbeat(frameA.seed_b64, frameA.serial, { ...telemetryA, boot_count: 42, data_written_kb: 1500 });
    await expect.poll(() => panelNumber(dashboard, 'Boot count', onlyA), SCRAPE).toBe(42);
  });

  test('fleet stats match the database', async () => {
    const truth = await groundTruth();

    expect(await panelNumber(dashboard, 'Registered frames')).toBe(truth.registered);
    expect(await panelNumber(dashboard, 'Frames reporting')).toBe(truth.reporting);
    expect(await panelNumber(dashboard, 'Unhealthy', onlyB)).toBe(1);
    expect(await panelNumber(dashboard, 'Service down', onlyB)).toBe(1);
    expect((await panelNumber(dashboard, 'Unhealthy', onlyA)) ?? 0).toBe(0);
  });

  test('resource panels show the reported values', async () => {
    const expected: [string, number, { refId?: string; fromMs?: number }?][] = [
      ['Avg CPU usage', 23.5],
      ['Avg RAM used', 75],
      ['Avg CPU temp', 51.5],
      ['CPU temperature by frame', 51.5],
      ['RAM used by frame', 75],
      ['CPU usage', 23.5],
      ['Load average', 0.4, { refId: 'B' }],
      ['Data partition used', 75],
      ['Data partition free', 1_000_000_000],
      ['Uptime', 7200],
      ['Boot count', 42],
      ['Reboots in range', 2, { fromMs: startedAt }],
      ['Data written per day', 500],
    ];
    for (const [title, value, options] of expected) {
      expect(await panelNumber(dashboard, title, { ...onlyA, ...options }), title).toBeCloseTo(value, 5);
    }
  });

  test('display and fault panels show the reported values', async () => {
    const expected: [string, number, { refId?: string; labels?: Record<string, string> }?][] = [
      ['Image refreshes', 30],
      ['Display failures', 1, { refId: 'A' }],
      ['Display failures', 4, { refId: 'B' }],
      ['Refresh duration', 4200],
      ['Consecutive display failures', 5],
      ['Images on frame', 12],
      ['App crashes', 2],
      ['Unclean resets', 1],
      ['WiFi signal', -55],
      ['Heap per service', 1_048_576, { labels: { service: 'display' } }],
      ['RSS per service', 8_388_608, { labels: { service: 'display' } }],
      ['Threads & fds per service', 6, { refId: 'A' }],
      ['Threads & fds per service', 21, { refId: 'B' }],
      ['Peaks this boot', 61.5, { refId: 'A' }],
      ['Peaks this boot', 3, { refId: 'B' }],
    ];
    for (const [title, value, options] of expected) {
      expect(await panelNumber(dashboard, title, { ...onlyA, ...options }), title).toBe(value);
    }
  });

  test('roster, build and state tables carry the reported labels', async () => {
    const serial = frameA.serial;

    expect(await panelNumber(dashboard, 'Fleet roster', { refId: 'A', labels: { serial_number: serial, version: BUILD.version, local_ip_address: '192.168.0.77' } })).toBe(1);
    expect(await panelNumber(dashboard, 'Build provenance per frame', { ...onlyA, labels: { serial_number: serial, version: BUILD.version, os_sha: BUILD.os_sha, app_sha: BUILD.app_sha, kernel: BUILD.kernel } })).toBe(1);
    expect(await panelNumber(dashboard, 'SD card per frame', { ...onlyA, labels: { serial_number: serial, sd_card: BUILD.sd_card } })).toBe(1500);
    expect(await panelNumber(dashboard, 'Release versions', { ...onlyA, labels: { version: BUILD.version } })).toBe(1);
    for (const [machine, state] of [['screen', 'slideshow'], ['wifi', 'connected'], ['update', 'idle']]) {
      expect(await panelNumber(dashboard, 'Current state per frame', { ...onlyA, labels: { serial_number: serial, machine, state } }), machine).toBe(1);
    }
  });

  test('log panels count this run’s connections and heartbeats', async () => {
    // Short buckets from the spec's start, so earlier runs on a kept stack stay outside.
    const range = { fromMs: startedAt, intervalSecs: 5 };

    expect(await panelSum(dashboard, 'Websocket connections', { ...range, refId: 'A' })).toBe(2);
    expect(await panelSum(dashboard, 'Websocket connections', { ...range, refId: 'C' })).toBe(1);
    expect(await panelSum(dashboard, 'Disconnect close codes', { ...range, labels: { close_code: '4002' } })).toBe(1);
    expect(await panelSum(dashboard, 'Heartbeat presence', { ...range, ...onlyA, labels: { serial_number: frameA.serial } })).toBe(2);
    expect(await panelRows(dashboard, 'Device events', { ...range, ...onlyA, contains: EVENT })).toBeGreaterThanOrEqual(1);
    expect(await panelRows(dashboard, 'Heartbeat payloads', { ...range, ...onlyA })).toBe(2);
    expect(await panelSum(dashboard, 'Stale connections reaped', range)).toBeGreaterThanOrEqual(1);
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard);
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);

    await openDashboard(page, dashboard.uid, { 'var-frame': frameA.serial });
    expect(await renderedText(page, 'Avg CPU temp')).toBe('51.5 °C');
    expect(await renderedText(page, 'Avg RAM used')).toBe('75.0%');
    expect(await renderedText(page, 'Reboots in range')).toBe('2');
  });
});
