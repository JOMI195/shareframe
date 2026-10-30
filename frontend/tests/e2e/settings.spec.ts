import path from 'node:path';
import { dave, erin, frank, mallory } from '../support/e2e/credentials';
import { expect, signIn, test } from '../support/e2e/fixtures';
import { expectMail, linkIn } from '../support/e2e/mailhog';

const FIXTURE = path.resolve(import.meta.dirname, '../support/e2e/assets/upload-fixture.jpg');

const openUserSettings = async (page: import('@playwright/test').Page, tab: string) => {
  await page.goto('/settings/user/');
  await expect(page.getByRole('heading', { name: 'Nutzerkonto' })).toBeVisible();
  await page.getByRole('tab', { name: tab }).click();
};

const signOut = async (page: import('@playwright/test').Page) => {
  await page.goto('/auth/sign-out/');
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in\/$/);
};

/**
 * Each flow uses its own seeded account, because all three change or destroy it
 * and the other specs sign in as seed_alice.
 */
test.describe('personal information', () => {
  test('renames the profile and keeps it after a reload', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Profil');

    await expect(page.getByText(erin.email)).toBeVisible();
    const username = page.getByLabel('Nutzername');
    await expect(username).toHaveValue(erin.username);

    await username.fill('erin_umbenannt');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await page.reload();
    await page.getByRole('tab', { name: 'Profil' }).click();
    await expect(page.getByLabel('Nutzername')).toHaveValue('erin_umbenannt');
  });

  test('crops, replaces and removes the profile picture', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Profil');

    const avatar = page.getByRole('tabpanel').locator('img');
    await expect(avatar).toHaveAttribute('src', /^blob:/, { timeout: 30_000 });
    const seeded = await avatar.getAttribute('src');

    await page.getByLabel('Profilbild auswählen').setInputFiles(FIXTURE);
    const dialog = page.getByRole('dialog', { name: 'Profilbild zuschneiden' });
    const zoom = dialog.getByRole('slider', { name: 'Zoom' });
    await expect(dialog.locator('img')).toBeVisible();

    await dialog.getByRole('button', { name: 'Vergrößern' }).click();
    await dialog.getByRole('button', { name: 'Nach rechts verschieben' }).click();
    await dialog.getByRole('button', { name: 'Reset' }).click();
    await expect(zoom).toHaveAttribute('aria-valuenow', '1');

    for (let i = 0; i < 5; i++) await dialog.getByRole('button', { name: 'Vergrößern' }).click();
    await expect(zoom).toHaveAttribute('aria-valuenow', '1.5');
    await dialog.getByRole('button', { name: 'Nach unten verschieben' }).click();
    const box = (await dialog.locator('img').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    let request: import('@playwright/test').Request | undefined;
    await page.route('**/accounts/me/avatar/', (route) => {
      if (route.request().method() === 'PUT') request = route.request();
      return route.continue();
    });
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => request).toBeDefined();

    // The fixture is 800x600, so a square smaller than its height proves the crop and zoom were applied.
    const uploaded = await page.evaluate(
      async ({ body, contentType }) => {
        const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
        const form = await new Response(bytes, { headers: { 'content-type': contentType } }).formData();
        const bitmap = await createImageBitmap(form.get('avatar') as File);
        return { width: bitmap.width, height: bitmap.height };
      },
      { body: request!.postDataBuffer()!.toString('base64'), contentType: (await request!.allHeaders())['content-type'] },
    );
    expect(uploaded.width).toBe(uploaded.height);
    expect(uploaded.width).toBeLessThan(600);

    await expect(avatar).not.toHaveAttribute('src', seeded!, { timeout: 30_000 });
    await expect(avatar).toHaveAttribute('src', /^blob:/);

    await page.getByRole('button', { name: 'Entfernen' }).click();
    await page.getByRole('button', { name: 'Profilbild entfernen' }).click();
    await expect(page.getByRole('button', { name: 'Entfernen' })).toBeHidden({ timeout: 30_000 });
    await expect(avatar).toBeHidden();
  });

  test('stops accepting friend requests', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Profil');

    const searchable = page.getByRole('switch', { name: 'Freundschaftsanfragen erhalten' });
    await expect(searchable).toBeChecked();
    await searchable.uncheck();
    await page.getByRole('button', { name: 'Speichern' }).click();

    await page.reload();
    await page.getByRole('tab', { name: 'Profil' }).click();
    await expect(
      page.getByRole('switch', { name: 'Freundschaftsanfragen erhalten' }),
    ).not.toBeChecked();
  });
});

test.describe('password', () => {
  const NEW_PASSWORD = 'Wechsel2026Sicher';

  test('changes the password and only the new one works afterwards', async ({ page }) => {
    await signIn(page, dave);
    await openUserSettings(page, 'Passwort');

    await page.getByLabel('Aktuelles Passwort').fill(dave.password);
    await page.getByLabel('Neues Passwort', { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel('Neues Passwort wiederholen').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: 'Speichern' }).click();

    // The form empties itself once the backend accepted the change.
    await expect(page.getByLabel('Aktuelles Passwort')).toHaveValue('', { timeout: 30_000 });
    await expectMail(dave.email, { subject: 'ShareFrame - Passwort geändert' });

    await signOut(page);

    await test.step('the old password is rejected', async () => {
      await page.getByLabel('Email').fill(dave.email);
      await page.getByLabel('Passwort').fill(dave.password);
      await page.getByRole('button', { name: 'anmelden' }).click();

      await expect(page.getByRole('alert').first()).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/sign-in\/$/);
    });

    await test.step('the new password works', async () => {
      await signIn(page, { ...dave, password: NEW_PASSWORD });
      await expect(page).toHaveTitle('Start – ShareFrame');
    });
  });

  test('refuses a wrong current password', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Passwort');

    await page.getByLabel('Aktuelles Passwort').fill('Falsches2026Passwort');
    await page.getByLabel('Neues Passwort', { exact: true }).fill('Anderes2026Passwort');
    await page.getByLabel('Neues Passwort wiederholen').fill('Anderes2026Passwort');
    await page.getByRole('button', { name: 'Speichern' }).click();

    // The session survives: the old password still gets us back in.
    await signOut(page);
    await signIn(page, erin);
    await expect(page).toHaveTitle('Start – ShareFrame');
  });
});

test.describe('email address', () => {
  const NEW_EMAIL = 'seed.frank.neu@shareframe.local';
  const signInFails = async (page: import('@playwright/test').Page, email: string) => {
    await page.goto('/auth/sign-in/');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Passwort').fill(frank.password);
    await page.getByRole('button', { name: 'anmelden' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/sign-in\/$/);
  };

  test('changes the address only after the link from the mail is opened', async ({ page }) => {
    // Two sign-ins, two mails and several reloads.
    test.setTimeout(120_000);
    await signIn(page, frank);
    await openUserSettings(page, 'Profil');

    // Hidden tab panels stay mounted, so the password tab has a field with the same label.
    const panel = page.getByRole('tabpanel');
    await panel.getByRole('button', { name: 'E-Mail ändern' }).click();
    await panel.getByLabel('Neue E-Mail-Adresse').fill(NEW_EMAIL);
    await panel.getByLabel('Aktuelles Passwort').fill(frank.password);
    await panel.getByRole('button', { name: 'Bestätigungslink senden' }).click();

    await expect(panel.getByText(`Bestätigungslink an ${NEW_EMAIL}`)).toBeVisible({ timeout: 30_000 });
    const confirmMail = await expectMail(NEW_EMAIL, { subject: 'ShareFrame - Neue E-Mail-Adresse bestätigen' });
    const link = linkIn(confirmMail, '/auth/users/email-change/');

    await test.step('nothing changes before the link is opened', async () => {
      await page.reload();
      await page.getByRole('tab', { name: 'Profil' }).click();
      await expect(page.getByRole('tabpanel').getByText(frank.email)).toBeVisible();
    });

    await test.step('the link switches the address and tells the old one', async () => {
      await page.goto(link);
      await expect(page.getByText('E-Mail-Adresse geändert', { exact: false })).toBeVisible();

      await openUserSettings(page, 'Profil');
      await expect(page.getByRole('tabpanel').getByText(NEW_EMAIL)).toBeVisible();
      const notice = await expectMail(frank.email, { subject: 'ShareFrame - E-Mail-Adresse geändert' });
      expect(notice.text).toContain('mit einer neuen E-Mail-Adresse');
    });

    await test.step('the link works only once', async () => {
      await page.goto(link);
      await expect(page.getByText('Der Link ist ungültig oder abgelaufen.')).toBeVisible();
    });

    await signOut(page);

    await test.step('only the new address signs in', async () => {
      await signInFails(page, frank.email);
      await signIn(page, { ...frank, email: NEW_EMAIL });
      await expect(page).toHaveTitle('Start – ShareFrame');
    });
  });

  test('refuses an address another account already uses', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Profil');

    const panel = page.getByRole('tabpanel');
    await panel.getByRole('button', { name: 'E-Mail ändern' }).click();
    await panel.getByLabel('Neue E-Mail-Adresse').fill(dave.email);
    await panel.getByLabel('Aktuelles Passwort').fill(erin.password);
    await panel.getByRole('button', { name: 'Bestätigungslink senden' }).click();

    await expect(page.getByText('Diese E-Mail ist bereits vergeben.')).toBeVisible();
    await expect(panel.getByLabel('Neue E-Mail-Adresse')).toHaveValue(dave.email);
  });
});

test.describe('account deletion', () => {
  test('deletes the account and locks the credentials out', async ({ page }) => {
    await signIn(page, mallory);
    await openUserSettings(page, 'Löschen');

    await expect(page.getByText('Diese Aktion ist unwiderruflich.')).toBeVisible();
    const panel = page.getByRole('tabpanel');
    await panel.getByRole('button', { name: 'Mein Konto löschen' }).click();
    await panel.getByLabel('Passwort', { exact: true }).fill(mallory.password);
    await panel.getByRole('button', { name: 'Konto löschen', exact: true }).click();

    const confirm = page.getByRole('dialog', { name: 'Konto endgültig löschen?' });
    await confirm.getByRole('button', { name: 'Endgültig löschen' }).click();

    // The account is gone, so the landing page keeps a signed-out visitor.
    await page.waitForURL('/', { timeout: 30_000 });
    await expectMail(mallory.email, { subject: 'ShareFrame - Konto gelöscht' });

    await test.step('the account cannot sign in any more', async () => {
      await page.goto('/auth/sign-in/');
      await page.getByLabel('Email').fill(mallory.email);
      await page.getByLabel('Passwort').fill(mallory.password);
      await page.getByRole('button', { name: 'anmelden' }).click();

      await expect(page.getByRole('alert').first()).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/sign-in\/$/);
    });
  });

  test('keeps the account when the confirmation is cancelled', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Löschen');

    const panel = page.getByRole('tabpanel');
    await panel.getByRole('button', { name: 'Mein Konto löschen' }).click();
    await panel.getByLabel('Passwort', { exact: true }).fill(erin.password);
    await panel.getByRole('button', { name: 'Konto löschen', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.goto('/dashboard/');
    await expect(page).toHaveTitle('Start – ShareFrame');
  });

  test('keeps the user on the page when the password is wrong', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Löschen');

    const panel = page.getByRole('tabpanel');
    await panel.getByRole('button', { name: 'Mein Konto löschen' }).click();
    await panel.getByLabel('Passwort', { exact: true }).fill('Falsches2026Passwort');
    await panel.getByRole('button', { name: 'Konto löschen', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Endgültig löschen' }).click();

    await expect(page.getByText('Löschen des Nutzerkontos fehlgeschlagen')).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/user\//);

    await page.goto('/dashboard/');
    await expect(page).toHaveTitle('Start – ShareFrame');
  });
});
