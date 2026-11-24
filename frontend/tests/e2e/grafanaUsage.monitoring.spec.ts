import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { type ApiClient, signedInClient } from '../support/e2e/api';
import { seedFrame } from '../support/e2e/board';
import { admin, alice, bob } from '../support/e2e/credentials';
import { exporterSamples, exporterValue } from '../support/e2e/exporter';
import { runFrameSession } from '../support/e2e/frameSim';
import { type Dashboard, loadDashboard, panelNumber } from '../support/e2e/grafana';
import { expectEveryPanelHasData } from '../support/e2e/grafanaExpectedEmpty';
import { expectDashboardRenders, grafanaAuthHeaders, openDashboard, renderedText } from '../support/e2e/grafanaUi';
import { FIXTURE } from '../support/e2e/photos';
import { runInBackend } from '../support/e2e/stack';

// The business scrape runs every four minutes.
const BUSINESS_SCRAPE = { timeout: 330_000, intervals: [10_000] };

const business = (name: string, labels?: Record<string, string>) => exporterValue('/metrics/business', name, labels);

const upload = async (client: ApiClient) => {
  const buffer = readFileSync(FIXTURE);
  const response = await client.postMultipart('/api/images/', {
    image: { name: 'monitoring.jpg', mimeType: 'image/jpeg', buffer },
    upload_image_sha256_hex_hash: createHash('sha256').update(buffer).digest('hex'),
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: number }).id;
};

const send = async (client: ApiClient, imageId: number, scheduledInSecs?: number) => {
  const now = Math.floor(Date.now() / 1000);
  const response = await client.post('/api/frames/send-image/', {
    reciever_username: bob.username,
    image_id: imageId,
    expiry_unix_timestamp: now + 86_400,
    ...(scheduledInSecs ? { scheduled_unix_timestamp: now + scheduledInSecs } : {}),
  });
  expect(response.ok(), await response.text()).toBe(true);
};

const frame = seedFrame('seed-frame-alice-living');

const backendPrints = async (code: string) => (await runInBackend(code)).includes('YES');

/** An admin command to an online frame, the only way commands come into being. */
const sendFrameCommand = async () => {
  const session = runFrameSession(frame.seed_b64, 15, {});
  const lookup = `from frames.models import Frame, FrameWebsocketConnection; f = Frame.objects.get(public_serial_number="${frame.serial}")`;
  await expect
    .poll(() => backendPrints(`${lookup}; print("YES" if FrameWebsocketConnection.objects.filter(frame=f).exists() else "NO")`), {
      timeout: 30_000,
    })
    .toBe(true);
  await runInBackend(
    `${lookup}; from frames.commands import send_command; from user_core.models import User; ` +
      `send_command(f, "request_diagnostics", User.objects.get(email="${admin.email}"))`,
  );
  await session;
};

test.describe('grafana usage dashboard', () => {
  test.use({ extraHTTPHeaders: grafanaAuthHeaders });

  test.describe.configure({ timeout: 10 * 60_000 });

  let dashboard: Dashboard;

  test.beforeAll(async () => {
    dashboard = await loadDashboard('shareframe-usage');
    const before = {
      uploads: await business('shareframe_images_uploaded_24h'),
      sent: await business('shareframe_sent_images_sent_24h'),
      scheduled: await business('shareframe_sent_images_scheduled'),
    };

    const client = await signedInClient(alice);
    const imageId = await upload(client);
    await send(client, imageId);
    await send(client, imageId, 3600);
    await client.dispose();
    await sendFrameCommand();

    // The collector sees the traffic; whether the panels do is what the tests check.
    expect(await business('shareframe_images_uploaded_24h')).toBe(before.uploads! + 1);
    expect(await business('shareframe_sent_images_sent_24h')).toBe(before.sent! + 1);
    expect(await business('shareframe_sent_images_scheduled')).toBe(before.scheduled! + 1);
  });

  const cases: [title: string, refId: string, expected: () => Promise<number | null>][] = [
    ['Users', 'A', () => business('shareframe_users_total')],
    ['Active today', 'A', () => business('shareframe_users_active', { window: '1d' })],
    ['Active 7d', 'A', () => business('shareframe_users_active', { window: '7d' })],
    ['Active 30d', 'A', () => business('shareframe_users_active', { window: '30d' })],
    ['Uploads 24h', 'A', () => business('shareframe_images_uploaded_24h')],
    ['Sent 24h', 'A', () => business('shareframe_sent_images_sent_24h')],
    ['Images stored', 'A', () => business('shareframe_images_total')],
    ['Frames', 'A', () => business('shareframe_frames_registered')],
    ['Uploads and deliveries per day', 'A', () => business('shareframe_images_uploaded_24h')],
    ['Uploads and deliveries per day', 'B', () => business('shareframe_sent_images_sent_24h')],
    ['Uploads and deliveries per day', 'C', () => business('shareframe_users_joined_24h')],
    ['Sent images by state', 'A', () => business('shareframe_sent_images_total')],
    ['Sent images by state', 'B', () => business('shareframe_sent_images_scheduled')],
    [
      'Sent images by state',
      'C',
      async () => (await business('shareframe_sent_images_total'))! + (await business('shareframe_sent_images_scheduled'))!,
    ],
    [
      'Sent images by activity',
      'B',
      async () => (await business('shareframe_sent_images_total'))! - (await business('shareframe_sent_images_expired'))!,
    ],
    ['Sent images by activity', 'C', () => business('shareframe_sent_images_expired')],
  ];

  for (const [title, refId, expected] of cases) {
    test(`${title} ${refId} matches the exporter`, async () => {
      const value = await expected();
      expect(value).not.toBeNull();
      await expect.poll(() => panelNumber(dashboard, title, { refId }), BUSINESS_SCRAPE).toBe(value);
    });
  }

  test('series panels split by the exporter labels', async () => {
    const accepted = await business('shareframe_friendships', { status: 'accepted' });
    expect(await panelNumber(dashboard, 'Friendships', { labels: { status: 'accepted' } })).toBe(accepted);
    const weekly = await business('shareframe_users_active', { window: '7d' });
    expect(await panelNumber(dashboard, 'Active users', { labels: { window: '7d' } })).toBe(weekly);
    const commands = await exporterSamples('/metrics/business', 'shareframe_frame_commands_24h');
    expect(commands.length).toBeGreaterThan(0);
    for (const { labels, value } of commands) {
      await expect
        .poll(() => panelNumber(dashboard, 'Frame commands (24h)', { labels: { status: labels.status } }), BUSINESS_SCRAPE)
        .toBe(value);
    }
  });

  test('every panel has data', async () => {
    await expectEveryPanelHasData(dashboard);
  });

  test('renders as users see it', async ({ page }) => {
    await openDashboard(page, dashboard.uid);
    await expectDashboardRenders(page, dashboard);
    expect(await renderedText(page, 'Users')).toBe(String(await business('shareframe_users_total')));
    expect(await renderedText(page, 'Frames')).toBe(String(await business('shareframe_frames_registered')));
  });
});
