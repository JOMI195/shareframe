import { expect, request, test } from '@playwright/test';
import { apiClient, signedInClient } from '../support/e2e/api';
import { seedFrame } from '../support/e2e/board';
import { erin } from '../support/e2e/credentials';
import { exporterValue } from '../support/e2e/exporter';
import { forgedSignature, rejectedOtp } from '../support/e2e/frameSim';
import { type Dashboard, grafanaAdmin, grafanaFormLogin, loadDashboard, panelNumber, panelRows, panelSum } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard } from '../support/e2e/grafanaUi';
import { composeExec, NGINX_URL, runInBackend } from '../support/e2e/stack';

const UNKNOWN_ACCOUNT = 'monitoring.unknown@shareframe.local';
const TEMP_PASSWORD = 'Monitoring-e2e-temp-1';
const SSH_ATTACKER = '198.51.100.7';
const frameA = seedFrame('seed-frame-main');
const frameB = seedFrame('seed-frame-office');

const BUSINESS_SCRAPE = { timeout: 330_000, intervals: [10_000] };

const setPassword = async (client: Awaited<ReturnType<typeof apiClient>>, current: string, next: string) =>
  (await client.post('/api/auth/users/set_password/', { current_password: current, new_password: next, re_new_password: next })).status();

/** The host's sshd/sudo/useradd lines, read by the real host-auth promtail job. */
const writeHostAuthLog = async () => {
  const at = new Date().toISOString();
  const lines = [
    `${at} testhost sshd[101]: Accepted publickey for deploy from 203.0.113.5 port 50000 ssh2`,
    `${at} testhost sshd[102]: Failed password for invalid user admin from ${SSH_ATTACKER} port 50001 ssh2`,
    `${at} testhost sshd[102]: Failed password for invalid user admin from ${SSH_ATTACKER} port 50002 ssh2`,
    `${at} testhost sudo: pam_unix(sudo:auth): authentication failure; logname=deploy uid=1000 euid=0 tty=/dev/pts/0 ruser=deploy rhost=  user=deploy`,
    `${at} testhost useradd[103]: new user: name=e2e, UID=1001, GID=1001, home=/home/e2e, shell=/bin/sh`,
  ];
  await composeExec('promtail', ['sh', '-c', 'printf "%s\\n" "$@" >> /host-log/auth.log', 'sh', ...lines]);
};

test.describe('grafana auth dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;
  let startedAt: number;
  // Short buckets from the spec's start, so earlier traffic stays outside the counts.
  const sinceStart = () => ({ fromMs: startedAt, intervalSecs: 5 });

  test.beforeAll(async () => {
    startedAt = Date.now();
    dashboard = await loadDashboard('shareframe-auth');

    for (let i = 0; i < 3; i++) {
      const stranger = await apiClient();
      expect((await stranger.signIn({ email: UNKNOWN_ACCOUNT, password: 'wrong-password' })).status()).toBe(401);
      await stranger.dispose();
    }

    const first = await signedInClient(erin);
    expect(await setPassword(first, erin.password, '12345')).toBe(400);
    expect(await setPassword(first, erin.password, TEMP_PASSWORD)).toBe(204);
    await first.dispose();

    const second = await signedInClient({ ...erin, password: TEMP_PASSWORD });
    expect(await setPassword(second, TEMP_PASSWORD, erin.password)).toBe(204);
    expect((await second.post('/api/auth/jwt/refresh/')).status()).toBe(200);
    // No X-CSRFToken header.
    expect((await second.context.post('/api/auth/jwt/logout/')).status()).toBe(403);
    expect((await second.post('/api/auth/jwt/logout/')).status()).toBeLessThan(300);
    await second.dispose();

    const forged = await request.newContext({
      baseURL: NGINX_URL,
      storageState: { cookies: [{ name: 'sf_access', value: 'not-a-jwt', domain: 'localhost', path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] },
    });
    expect((await forged.get('/api/auth/users/me/')).status()).toBe(401);
    await forged.dispose();

    const noCookie = await apiClient();
    expect((await noCookie.post('/api/auth/jwt/refresh/')).status()).toBe(401);
    await noCookie.dispose();

    expect(await rejectedOtp(frameB.seed_b64)).toBe(401);
    expect(await forgedSignature(frameA.seed_b64, frameB.serial)).toBe(403);

    expect(await grafanaFormLogin(grafanaAdmin.password)).toBe(200);
    expect(await grafanaFormLogin('not-the-password')).toBe(401);

    await writeHostAuthLog();
  });

  test.afterAll(async () => {
    // Other specs sign in as erin; never leave the temporary password behind.
    await runInBackend(
      `from user_core.models import User; u = User.objects.get(email="${erin.email}"); u.set_password("${erin.password}"); u.save()`,
    );
  });

  test('stat panels count this run’s sign-ins and rejections', async () => {
    const counts: [string, number][] = [
      ['App logins', 2],
      ['Failed logins', 3],
      ['Throttled logins', 0],
      ['Password rejections', 1],
      ['Token rejections', 2],
    ];
    for (const [title, expected] of counts) {
      await expect.poll(() => panelNumber(dashboard, title, sinceStart()), { message: title, timeout: 60_000 }).toBe(expected);
    }
  });

  test('session stats match the exporter', async () => {
    const cases: [string, string][] = [
      ['Valid sessions', 'shareframe_auth_sessions_active'],
      ['Users with a session', 'shareframe_auth_session_users'],
      ['Admin accounts', 'shareframe_users_admins'],
    ];
    for (const [title, metric] of cases) {
      const expected = await exporterValue('/metrics/business', metric);
      await expect.poll(() => panelNumber(dashboard, title), { ...BUSINESS_SCRAPE, message: title }).toBe(expected);
    }
  });

  test('breakdowns name the accounts, reasons and endpoints', async () => {
    const range = sinceStart();
    const sums: [string, number, { refId?: string; labels?: Record<string, string> }][] = [
      ['Sign-ins', 2, { refId: 'A' }],
      ['Sign-ins', 3, { refId: 'B' }],
      ['Failed logins by account', 3, { labels: { account: UNKNOWN_ACCOUNT } }],
      ['Logins by account', 2, { labels: { account: erin.email } }],
      ['Failed logins by country', 3, { labels: { country: 'unknown' } }],
      ['Token activity', 1, { refId: 'A' }],
      ['Token activity', 1, { refId: 'B', labels: { reason: 'missing' } }],
      ['Token activity', 1, { refId: 'C' }],
      ['Token activity', 1, { refId: 'D' }],
      ['CSRF failures', 1, {}],
      ['Auth endpoints by status', 3, { labels: { endpoint: 'jwt/create', status: '401' } }],
      ['Auth endpoints by status', 2, { labels: { endpoint: 'jwt/create', status: '200' } }],
      ['Auth endpoints by status', 2, { labels: { endpoint: 'users/set_password', status: '204' } }],
      ['Password rejections by reason', 1, { labels: { code: 'password_invalid' } }],
      ['Failed password rules', 1, { refId: 'A' }],
      ['Failed password rules', 1, { refId: 'C' }],
      ['Account changes', 2, { labels: { event: 'Password changed' } }],
      ['Frame auth failures', 1, { refId: 'A', labels: { serial: frameB.serial } }],
      ['Frame auth failures', 1, { refId: 'B', labels: { frame: frameB.serial } }],
      ['Grafana sign-ins', 1, { refId: 'A' }],
      ['Grafana sign-ins', 1, { refId: 'B' }],
    ];
    for (const [title, expected, options] of sums) {
      await expect
        .poll(() => panelSum(dashboard, title, { ...range, ...options }), { message: `${title} ${JSON.stringify(options)}`, timeout: 60_000 })
        .toBe(expected);
    }
  });

  test('host panels read the auth.log lines', async () => {
    const range = sinceStart();
    const sums: [string, number, { refId?: string; labels?: Record<string, string> }][] = [
      ['SSH and sudo', 1, { refId: 'A' }],
      ['SSH and sudo', 2, { refId: 'B' }],
      ['SSH and sudo', 1, { refId: 'C' }],
      ['SSH and sudo', 1, { refId: 'D' }],
      ['Failed SSH by IP', 2, { labels: { ip: SSH_ATTACKER } }],
    ];
    for (const [title, expected, options] of sums) {
      await expect
        .poll(() => panelSum(dashboard, title, { ...range, ...options }), { message: `${title} ${JSON.stringify(options)}`, timeout: 60_000 })
        .toBe(expected);
    }
    expect(await panelRows(dashboard, 'Host auth log', range)).toBe(5);
    expect(await panelRows(dashboard, 'Grafana auth log', range)).toBe(2);
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard, sinceStart());
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
  });
});
