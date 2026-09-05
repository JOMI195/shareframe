import { dave, erin, mallory } from '../support/e2e/credentials';
import { expect, signIn, test } from '../support/e2e/fixtures';

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

    await expect(page.getByLabel('Email')).toHaveValue(erin.email);
    const username = page.getByLabel('Nutzername');
    await expect(username).toHaveValue(erin.username);

    await username.fill('erin_umbenannt');
    await page.getByRole('button', { name: 'Speichern' }).click();

    await page.reload();
    await page.getByRole('tab', { name: 'Profil' }).click();
    await expect(page.getByLabel('Nutzername')).toHaveValue('erin_umbenannt');
  });

  test('stops accepting friend requests', async ({ page }) => {
    await signIn(page, erin);
    await openUserSettings(page, 'Profil');

    const searchable = page.getByRole('checkbox', { name: 'Freundschaftsanfragen erhalten' });
    await expect(searchable).toBeChecked();
    await searchable.uncheck();
    await page.getByRole('button', { name: 'Speichern' }).click();

    await page.reload();
    await page.getByRole('tab', { name: 'Profil' }).click();
    await expect(
      page.getByRole('checkbox', { name: 'Freundschaftsanfragen erhalten' }),
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

test.describe('account deletion', () => {
  test('deletes the account and locks the credentials out', async ({ page }) => {
    await signIn(page, mallory);
    await openUserSettings(page, 'Löschen');

    await expect(page.getByText('Diese Aktion ist unwiderruflich.')).toBeVisible();
    await page.getByRole('button', { name: 'Mein Konto löschen' }).click();

    await expect(
      page.getByText('Bitte bestätige die Löschung deines Kontos mit deinem Passwort.'),
    ).toBeVisible();
    // Hidden tab panels stay mounted, so 'Passwort' also matches the password tab.
    await page.getByRole('dialog').getByLabel('Passwort', { exact: true }).fill(mallory.password);
    await page.getByRole('button', { name: 'Löschen bestätigen' }).click();

    // The account is gone, so the landing page keeps a signed-out visitor.
    await page.waitForURL('/', { timeout: 30_000 });

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

    await page.getByRole('button', { name: 'Mein Konto löschen' }).click();
    await page.getByRole('button', { name: 'Abbrechen' }).click();

    await page.goto('/dashboard/');
    await expect(page).toHaveTitle('Start – ShareFrame');
  });
});
