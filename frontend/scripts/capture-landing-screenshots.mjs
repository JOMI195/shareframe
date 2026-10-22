// Captures the app screenshots for the landing page from the seeded dev stack.
// Usage: npm run db:reset && node scripts/capture-landing-screenshots.mjs [baseUrl]
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/assets/landing/screenshots");
const baseUrl = process.argv[2] ?? "http://localhost:3000";
const user = { email: "seed.alice@shareframe.local", password: "seed-alice-dev-pass1" };

const shots = [
  { name: "dashboard", path: "/dashboard/" },
  { name: "fotos", path: "/fotos/" },
  { name: "aktivitaeten", path: "/aktivitaeten/" },
  { name: "bilderrahmen", path: "/bilderrahmen/" },
  { name: "freunde", path: "/freunde/" },
];

const viewports = [
  { suffix: "", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  { suffix: "-mobil", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
];

const dismissDialogs = async (page) => {
  const dialog = page.getByRole("dialog").first();
  await dialog.waitFor({ state: "visible", timeout: 3_000 }).catch(() => undefined);
  if (await dialog.isVisible()) {
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  }
};

// Seasonal decorations would date the screenshots; patched before the app rehydrates.
const disableSeasonalThemes = () => {
  const key = "persist:shareframe-data";
  const raw = localStorage.getItem(key);
  if (!raw) return;
  const persisted = JSON.parse(raw);
  const ui = JSON.parse(persisted.ui ?? "{}");
  ui.settings = { ...ui.settings, design: { ...ui.settings?.design, seasonalThemes: false } };
  localStorage.setItem(key, JSON.stringify({ ...persisted, ui: JSON.stringify(ui) }));
};

// The seeded frames never connect, so they would all show as offline.
const markFramesOnline = (value) => {
  if (Array.isArray(value)) return value.map(markFramesOnline);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) =>
        [key, key === "last_seen" ? new Date().toISOString() : markFramesOnline(child)]),
    );
  }
  return value;
};

const fakeOnlineFrames = (page) =>
  page.route((url) => url.pathname.startsWith("/api/"), async (route) => {
    const response = await route.fetch();
    if (!(response.headers()["content-type"] ?? "").includes("application/json")) {
      return route.fulfill({ response });
    }
    return route.fulfill({ response, json: markFramesOnline(await response.json()) });
  });

const signIn = async (page) => {
  await page.goto(`${baseUrl}/auth/sign-in/`);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Passwort").fill(user.password);
  await page.getByRole("button", { name: "anmelden" }).click();
  await page.waitForURL(/\/dashboard\/$/);
  await dismissDialogs(page);
};

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const colorScheme of ["light", "dark"]) {
  for (const { suffix, ...device } of viewports) {
    const context = await browser.newContext({ ...device, colorScheme, reducedMotion: "reduce" });
    await context.addInitScript(disableSeasonalThemes);
    const page = await context.newPage();
    await fakeOnlineFrames(page);
    await signIn(page);

    for (const shot of shots) {
      await page.goto(baseUrl + shot.path);
      await page.waitForLoadState("networkidle");
      await dismissDialogs(page);
      const file = join(outDir, `${shot.name}${suffix}-${colorScheme}.png`);
      await page.screenshot({ path: file, animations: "disabled" });
      console.log(`captured ${file}`);
    }

    await context.close();
  }
}

await browser.close();
