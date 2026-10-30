import type { Page } from '@playwright/test';
import {
  ADMIN_NOTIFICATION_EMAIL,
  admin,
  carol,
  dave,
  erin,
  grace,
  ivy,
} from '../support/e2e/credentials';
import { expect, signIn, test } from '../support/e2e/fixtures';
import { expectMail, expectNoMail, linkIn, unsubscribeUrl } from '../support/e2e/mailhog';
import { API_URL, runInBackend } from '../support/e2e/stack';

const ADMIN_URL = `${API_URL}/admin`;
const CHANGELOG = 'Seed: Bilder in Gruppen sortieren';
const TEST_CHANGELOG = 'Seed: Schnellere Übertragung an den Rahmen';
const REMINDER = 'ShareFrame - Lange kein Foto mehr geteilt';

const signInToAdmin = async (page: Page, password = admin.password) => {
  await page.goto(`${ADMIN_URL}/login/`);
  await page.locator('#id_username').fill(admin.email);
  await page.locator('#id_password').fill(password);
  await page.locator('input[type="submit"]').click();
};

const enableEmailFor = async (page: Page, kinds: string[]) => {
  await page.goto(`${ADMIN_URL}/notifications/channelsetting/`);
  for (const kind of kinds) {
    const row = page.getByRole('row').filter({ hasText: kind }).filter({ hasText: 'Email' });
    await row.locator('input[name$="-enabled"]').check();
  }
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.messagelist')).toBeVisible();
};

const runChangelogAction = async (page: Page, title: string, action: string) => {
  await page.goto(`${ADMIN_URL}/changelogs/changelog/`);
  await page.getByRole('row').filter({ hasText: title }).getByRole('button', { name: action }).click();
};

/**
 * Every mail the backend sends, delivered through real SMTP into Mailhog. The
 * account mails that other specs trigger anyway (login, password change, email
 * change, deletion) are checked there. Serial, because the notifications need
 * the channels the admin switches on first.
 */
test.describe.serial('mails', () => {
  test('activates an account through the mailed link', async ({ page, request, baseURL }) => {
    const since = new Date();
    const response = await request.post(`${API_URL}/auth/users/resend_activation/`, {
      data: { email: ivy.email },
    });
    expect(response.status()).toBe(204);

    const activation = await expectMail(ivy.email, { subject: 'ShareFrame - Konto aktivieren', since });
    const link = linkIn(activation, '/auth/users/activate/');
    expect(link.startsWith(baseURL!)).toBe(true);

    await page.goto(link);
    await expect(page.getByText('Nutzeraktivierung erfolgreich')).toBeVisible();
    await expectMail(ivy.email, { subject: 'ShareFrame - Konto aktiviert', since });

    await signIn(page, ivy);
  });

  test('resets a forgotten password through the mailed link', async ({ page, baseURL }) => {
    const NEW_PASSWORD = 'Zurueck2026Gesetzt';
    const since = new Date();
    await page.goto('/auth/users/password-reset/form/');
    await page.getByLabel('Email').fill(grace.email);
    await page.getByRole('button', { name: 'Passwort zurücksetzen' }).click();

    const reset = await expectMail(grace.email, { subject: 'ShareFrame - Passwort zurücksetzen', since });
    const link = linkIn(reset, '/auth/users/password-reset/');
    expect(link.startsWith(baseURL!)).toBe(true);

    await page.goto(link);
    // Required fields carry a trailing asterisk in their label.
    await page.getByRole('textbox', { name: /^Neues Passwort/ }).fill(NEW_PASSWORD);
    await page.getByRole('textbox', { name: /^Passwort wiederholen/ }).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Passwort neu vergeben' }).click();
    await expectMail(grace.email, { subject: 'ShareFrame - Passwort geändert', since });

    await signIn(page, { ...grace, password: NEW_PASSWORD });
  });

  test('tells the admin address about admin sign-ins', async ({ page }) => {
    const since = new Date();

    await signInToAdmin(page, 'Falsches2026Passwort');
    await expect(page.locator('.errornote')).toBeVisible();
    await expectMail(ADMIN_NOTIFICATION_EMAIL, {
      subject: 'ShareFrame - Fehlgeschlagener Admin Login-Versuch',
      since,
    });

    await signInToAdmin(page);
    await expect(page.locator('#site-name')).toBeVisible();
    const login = await expectMail(ADMIN_NOTIFICATION_EMAIL, { subject: 'ShareFrame - Admin-Login', since });
    expect(login.text).toContain(`Konto: ${admin.email}`);
  });

  test('notifies group members of a changelog, unsubscribable in one click', async ({ page, request }) => {
    const since = new Date();
    await signInToAdmin(page);
    await enableEmailFor(page, ['Changelog']);

    await runChangelogAction(page, CHANGELOG, 'Notify group members');
    await page.getByRole('button', { name: 'Yes, notify' }).click();
    await expect(page.locator('.messagelist')).toContainText('notifications queued');

    const mail = await expectMail(carol.email, { subject: `ShareFrame - ${CHANGELOG}`, since, unsubscribable: true });
    const oneClick = unsubscribeUrl(mail);
    expect(oneClick.startsWith(`${API_URL}/notifications/unsubscribe/one-click/?token=`)).toBe(true);

    await test.step('a link scanner following the URL changes nothing', async () => {
      expect((await request.get(oneClick)).status()).toBe(405);
    });

    await test.step('the mail provider POST opts out of exactly this kind', async () => {
      const response = await request.post(oneClick, { form: { 'List-Unsubscribe': 'One-Click' } });
      expect(response.status()).toBe(204);

      await signIn(page, carol);
      await page.goto('/settings/user/?tab=notifications');
      await expect(page.getByRole('switch', { name: 'Neuigkeiten per E-Mail' })).not.toBeChecked();
    });
  });

  test('sends the admin a changelog test mail without an unsubscribe header', async ({ page }) => {
    const since = new Date();
    await signInToAdmin(page);

    await runChangelogAction(page, TEST_CHANGELOG, 'Notify me (test)');
    await expect(page.locator('.messagelist')).toContainText('Test notification queued');

    await expectMail(ADMIN_NOTIFICATION_EMAIL, { subject: `ShareFrame - ${TEST_CHANGELOG}`, since });
  });

  test('reminds an inactive account once', async ({ page }) => {
    const since = new Date();
    await signInToAdmin(page);
    await enableEmailFor(page, ['Inactivity reminder']);

    // The reminder only runs on a schedule, there is nothing to click.
    await runInBackend('from notifications.tasks import send_inactivity_reminders; send_inactivity_reminders()');

    const reminder = await expectMail(dave.email, { subject: REMINDER, since, unsubscribable: true });
    expect(linkIn(reminder, '/fotos/')).toBeDefined();
    // Reminded ten days ago and inactive since, so not due again.
    await expectNoMail(erin.email, REMINDER, since);
  });
});
