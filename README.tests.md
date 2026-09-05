# Testing

Everything test-related for this repo lives here. The frontend carries the whole
suite; the backend has no tests yet.

## Strategy

The pyramid is deliberately bottom-heavy:

| Tier | What it is | Where | Runs against | Count |
|---|---|---|---|---|
| **unit** | Pure logic: helpers, reducers, migrations, guards, URL builders | `frontend/tests/unit/` | nothing | ~42 files |
| **integration** | Real components and the real store, rendered in jsdom | `frontend/tests/integration/` | MSW mocks | ~28 files |
| **e2e** | The browser driving the real app | `frontend/tests/e2e/` | a throwaway backend + database | **5 files, 23 tests** |

Why this shape:

- **Unit tests** are where the fiddly rules live — expiry maths, validation
  limits, list mutation semantics, persistence migrations. They are fast and they
  fail with a precise message.
- **Integration tests carry the weight.** They mount the real route tree or a real
  screen, with the real reducers and the real axios stack, and answer the network
  from MSW. They catch almost everything an e2e test would — routing, guards,
  forms, dialogs, snackbars, query strings — without a container in sight, and
  they are not flaky.
- **E2E stays small on purpose.** Real browsers plus a real backend are slow and
  brittle, so a flow only earns a spec when the *value is the integration itself* —
  a rule that lives in the backend, a real credential, or a real file:

  | Spec | Why it needs the real thing |
  |---|---|
  | `auth.spec.ts` | cookie JWT, CSRF, the session surviving a reload |
  | `frames.spec.ts` | OTPs are issued and expired by the backend; unregistering hands the frame back |
  | `friendships.spec.ts` | who may be found by their friend code, and what accepting does to both sides |
  | `imageLifecycle.spec.ts` | multipart upload, server-side SHA-256, variant generation, the friendship rule on send, soft delete |
  | `settings.spec.ts` | the password really changes, the account really stops working |

  Everything else — navigation, SEO, public pages, sent-image filters, changelogs,
  dialog wiring, validation messages — lives in `integration/flows/` instead.

**Every e2e flow also exists as a mocked flow** under `tests/integration/flows/`, so
a regression normally surfaces in the fast tier first and the e2e run is a
confirmation, not the only signal.

## Layout

```
frontend/tests/
├─ unit/            *.test.ts    pure logic, no rendered tree; mirrors src/
├─ integration/     *.test.tsx   components + store + MSW
│  └─ flows/        *.flow.test.tsx  journeys through the real route tree
├─ e2e/             *.spec.ts    Playwright against a real stack
└─ support/         NO TESTS LIVE HERE
   ├─ setup/        vitest.setup.ts — jsdom gaps, MSW lifecycle, cleanup
   ├─ mocks/        MSW server, per-domain handlers, named scenarios
   ├─ fixtures/     data factories, one file per entity
   ├─ helpers/      renderWithProviders, renderRoute, preloadedState, speedDial
   └─ e2e/          Playwright fixtures, stack lifecycle, credentials, assets
```

Rules:

- `*.test.ts(x)` is vitest, `*.spec.ts` is Playwright. **Nothing under `support/`
  matches either pattern**, so a file's location alone tells you whether it is a
  test or scaffolding.
- `unit/` and `integration/` mirror the `src/` path of their subject.
- Scaffolding is imported through the `@tests` alias (`@tests/helpers/renderRoute`),
  never with `../../..`.

## Running

```bash
cd frontend
npm run check            # lint + tsc + unit/integration — run this before committing
npm run test             # unit + integration (~15 s, no Docker)
npm run test:unit
npm run test:integration
npm run test:watch
npm run test:coverage    # thresholds are pinned at the current baseline
npm run test:e2e         # starts a throwaway stack, runs 2 specs, destroys it
```

### The e2e stack

`npm run test:e2e` owns the whole lifecycle:

1. `globalSetup` runs `docker compose -p shareframe-e2e -f docker-compose.e2e.yml
   --env-file .env.e2e up -d --build --wait`. The stack is backend + postgres +
   redis + a mailhog sink (account mails go through SMTP, and a refused connection
   becomes a 500 that rolls the request back); the database lives in **tmpfs**, so
   every run starts from the seed data.
2. Playwright's `webServer` serves the SPA with `vite --mode e2e` on port 3100.
   Vite's `envDir` is the repo root, so it reads the same `.env.e2e` the stack does.
3. `globalTeardown` runs `down -v --remove-orphans`. Nothing survives.

Ports are offset from the dev stack (backend 8100, SPA 3100) so both can run side
by side. `.env.e2e` is committed on purpose — every value in it is fake.

Escape hatches while debugging:

```bash
E2E_KEEP_STACK=1 npm run test:e2e   # leave the stack running afterwards
E2E_NO_STACK=1   npm run test:e2e   # reuse a stack that is already up
npm run e2e:up / npm run e2e:down   # drive the stack by hand
npx playwright install chromium     # once
```

Because the database is fresh per run, the specs do not clean up after themselves.
They do, however, share one database **within** a run: files execute in
alphabetical order on a single worker, so anything destructive uses an account of
its own.

| Spec | Account | What it changes |
|---|---|---|
| auth, frames, friendships, imageLifecycle | `seed_alice` | releases one of her two frames, accepts `seed_dave`, ends the friendship with `seed_carol`, uploads and deletes a photo |
| settings — profile | `seed_erin` | renames her, turns her friend code off |
| settings — password | `seed_dave` | changes his password |
| settings — deletion | `seed_mallory` | deletes the account |

When you add a spec that changes data, either pick an account nobody else uses or
restore what you changed.

## Writing a test

### Which tier?

- Does it need a DOM? → **unit**, otherwise read on.
- Can MSW answer everything the screen asks for? → **integration**.
- Does the point of the test *only* hold with the real backend (multipart upload,
  cookie JWT, cross-user rules)? → **e2e** — and even then, ask whether one of the
  two existing specs can absorb it as a step.

### Unit

```ts
import { describe, expect, it } from 'vitest';
import { toExpirationHours } from '@/main/images/dialogs/sendImageToUserFrame/expiration';

describe('toExpirationHours', () => {
  it('turns days into hours', () => {
    expect(toExpirationHours('3', 'days')).toBe(72);
  });
});
```

Globals are off: import `describe`/`it`/`expect`/`vi` from `vitest` explicitly.

### Integration — one screen

```tsx
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import Password from '@/main/settings/user/password/password';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';
import { signedInState } from '@tests/helpers/preloadedState';
import { server, failsWith } from '@tests/mocks';

describe('password settings', () => {
  it('reports a rejected change', async () => {
    server.use(...failsWith('post', 'auth/users/set_password/', 400));
    const { user, store } = renderWithProviders(<Password />, {
      preloadedState: signedInState(),
    });

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(store.getState().auth.user.api.loading).toBe(false));
  });
});
```

### Integration — a journey

```tsx
import { renderRoute } from '@tests/helpers/renderRoute';
import { server, withImages } from '@tests/mocks';
import { makeImages } from '@tests/fixtures';

server.use(...withImages(makeImages(3)));
const { user, router, store } = renderRoute('/fotos/', { preloadedState: signedInState() });
```

`renderRoute` mounts the **real route table** (`src/routes/routing.tsx`) in a
memory router, so guards, layouts, SEO head and feature selection all run.
`renderWithProviders` is the same providers without the router tree, for a single
component. Both return `{ store, user, ...RTL }`.

### E2E

```ts
import { expect, test } from '../support/e2e/fixtures';

test('...', async ({ signedInPage: page }) => { ... });
```

The `signedInPage` fixture signs in as the seeded `seed_alice` and dismisses the
first-run changelog dialog. Credentials come from `tests/support/e2e/credentials.ts`,
which mirrors `seed-data/users.json`.

## Conventions

**Mocks.** `tests/support/mocks/handlers/` holds one file per API domain. Every
handler is built from the app's own URL builders (`apiUrl(images.getImagesUrl())`),
so renaming a path breaks the handler instead of silently passing. The default set
answers *every* call the app can make with an empty, signed-in world — MSW runs
with `onUnhandledRequest: 'error'`, so an unmocked call is a failure, not a hang.

Per-test data comes from `scenarios.ts`:

```ts
server.use(...withImages(makeImages(3)));      // populated library
server.use(...withFriendships([...]));         // friends
server.use(...signedOut());                    // 401 on the profile
server.use(...failsWith('post', url, 413));    // an error response
const { handler, calls } = spyOnRequests('get', url);  // assert on the request
```

**Fixtures.** One file per entity in `tests/support/fixtures/`, each exporting a
`makeX(overrides)` factory. Never hand-write an entity in a test; override the one
field the test is about.

**State.** `buildState(partial)` and `signedInState(partial)` build a preloaded
store from a deep partial. `signedInState` also sets `localStorage.loggedIn`,
which is what the route guard reads.

**Assertions.** Prefer what the user sees (role + accessible name, German text)
over test ids. Where MUI leaves a control without an accessible name — the speed
dial actions, the receiver select — there is a helper or a documented fallback;
copy that rather than inventing a new one.

**Comments.** Explain *why* a test looks unusual (a jsdom gap, an MUI transition),
never what the code does.

## What not to test

- MUI internals, styling, or layout. Assert behaviour, not classes.
- Whole-DOM snapshots. Inline snapshots are used only to pin small, exact
  contracts (URL builders, action payloads, snackbar wording).
- A reducer through the UI when a unit test on the reducer says it better.
- The same rule at two tiers. Request payloads are asserted at the action level;
  a screen test asserts what the screen decided, not the wire format.
- Third-party behaviour (formik, react-router, axios). Test *our* use of it.

## Known jsdom / MSW adjustments

These live in `vitest.config.ts` and `tests/support/setup/vitest.setup.ts` and are
the only places the test environment deviates from the browser:

- `axios` is aliased to its **browser** build; the node build serializes multipart
  with the `form-data` package and cannot handle a jsdom `File`.
- The axios instance uses the **fetch** adapter under test; jsdom's XHR never
  finishes a multipart body under MSW.
- `IntersectionObserver`, `ResizeObserver`, `matchMedia`, `URL.createObjectURL`,
  `scrollIntoView` and `window.location` are stubbed. `triggerIntersection()`
  drives lazy image loading by hand.
- `react-easy-crop` and `getCroppedImg` are mocked in the upload tests: jsdom has
  neither layout nor canvas. The crop maths has its own unit test.

Session refresh (401 → refresh → replay → sign-out) is covered at the service
level in `tests/integration/services/httpService.test.ts`, which reloads the
module per case because the interceptor keeps module-level state.

## Known product bugs the tests document

These surfaced while writing the tests. They are **not** fixed, and the tests
describe today's behaviour, not the intended one:

- **Frame serials cannot be registered through the UI.** The backend derives
  `public_serial_number` as four groups of four (`XXXX-XXXX-XXXX-XXXX`), while the
  register dialog's yup schema demands five groups of five. `frames.flow.test.tsx`
  uses the dialog's format and says so in a comment.
- **`updateMyAccount` targets a route that is not mounted.** `user_accounts.urls`
  is not included in `config/urls.py`, so `PATCH /api/accounts/me/` is a 404. The
  action has no callers; the searchable flag travels with `PATCH auth/users/me/`
  instead, which does work.
- **The change-password form validates the *current* password against the
  new-password policy**, so an account whose password has no digit can never
  change it through the UI. The seeded passwords carry a digit for this reason.

One bug the e2e run did force a fix for: anonymising an account built a 45
character username for a 25 character column, so deleting an account returned a
500 and rolled back. `user_core/models.py` now sizes the suffix to the field.

## Seed data

Shared by the local stacks and the e2e run: see [`seed-data/README.md`](seed-data/README.md).

`npm run db:reset` truncates the **dev** database and re-seeds it (flush →
create_image_sizes → seed_dev_data → seed_changelogs). Destructive and manual
only; nothing invokes it automatically. The e2e stack never needs it — its
database is thrown away.
