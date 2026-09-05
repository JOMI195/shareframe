# Testing

Frontend and backend each have their own suite. They share one stack and one seed
corpus ([`seed-data/README.md`](seed-data/README.md)).

## Frontend

```bash
cd frontend
npm run check      # lint + tsc + unit/integration — run before committing
npm run test       # unit + integration, no Docker
npm run test:e2e   # brings the stack up, runs the specs, destroys it
```

```
frontend/tests/
├─ unit/          *.test.ts    pure logic, mirrors src/
├─ integration/   *.test.tsx   components + real store + MSW; flows/ uses the real routes
├─ e2e/           *.spec.ts    Playwright
└─ support/       NO TESTS LIVE HERE
```

**Which tier?** No DOM → unit. MSW can answer everything → integration. Only true
against a real backend → e2e, and prefer a step in an existing spec.

- MSW runs with `onUnhandledRequest: 'error'`; handlers are built from the app's own
  URL builders, so a renamed path breaks them instead of silently passing.
- jsdom gaps are patched only in `vitest.config.ts` and `tests/support/setup/`.
- E2E specs share one database and run alphabetically on one worker, so anything
  destructive uses its own account.

## Backend

```bash
cd backend
uv sync --group dev       # once
./bin/test.sh             # starts the test database, runs everything
./bin/test.sh tests/api   # or -k <subject>, --create-db, --cov
uv run pytest tests/unit  # no database, no Docker
```

```
backend/
├─ conftest.py                  seeding, API clients, the throttle switch
└─ tests/
   ├─ unit/          test_*.py  the django_db marker is rejected here
   ├─ integration/   test_*.py  models, signals, tasks, serializers, consumers
   ├─ api/           test_*.py  DRF client against mounted endpoints
   └─ support/       NO TESTS LIVE HERE
```

**Which tier?** Decided by the boundary a test crosses, not by its subject. Runs
without the database → unit. Needs the ORM, channel layer, filesystem or mail but
still calls the code directly → integration. Routing, permissions, status codes,
wire format → api.

The first rule is enforced: collection fails if anything under `tests/unit/` uses
`django_db`. **The ORM is never mocked** — a rule that needs a query is an
integration test; extract the pure part instead.

### Database

pytest creates `test_backend_db` beside the stack's `backend_db`, so a Playwright run
and a pytest run can share one container. The corpus is seeded once per session and
each test rolls back onto it. `--reuse-db` is the default; `--create-db` rebuilds.

`django_db(transaction=True)` commits for real and flushes afterwards, which empties
the corpus. `conftest.py` runs those last and re-seeds if needed, so such a test must
build its own data with factories. Only the cases that reach the channel layer
through `async_to_sync` need it.

### Fixtures

`alice` / `bob` / `carol` are signed-in clients for seeded accounts;
`client_for(seed.DAVE)` for any other, `client` anonymous, `client_as(user)` for a
factory-built user. All carry the auth cookies and echo `X-CSRFToken`, so popping
`csrftoken` is how you assert a 403.

`tests/support/helpers/frames.py` builds board headers: `signature_headers`,
`token_headers`, `hmac_headers`. `serial_for(seed_b64)` derives the serial rather
than hard-coding it. `tests/support/seed.py` reads `seed-data/*.json`, so the corpus
and the tests cannot drift.

### Test settings

`config/settings_test.py` swaps Redis, mail and Celery for in-memory equivalents and
moves `MEDIA_ROOT` aside. Two consequences:

- **`DEBUG=False` on purpose** — the media views are only mounted when it is false;
  the trade is that `api/schema/` is not routed.
- **Throttles are off.** The `throttled` fixture restores the real rates.

## The test stack

`docker-compose.test.yml` + `.env.test`, always under `-p shareframe-test`: backend,
postgres (tmpfs), redis, mailhog. Ports are offset from dev, so both stacks can run
at once. `.env.test` is committed; every value in it is fake.

Playwright brings up everything; pytest needs only `backend_db`.

**Don't start an e2e run while pytest is mid-session** — its teardown runs `down -v`.
`E2E_KEEP_STACK=1` covers the other direction. Always pass `-p shareframe-test`, or
a `down -v` hits the dev database.

```bash
npm run e2e:up / npm run e2e:down      # from frontend/
npm run db:reset                       # flushes and re-seeds the DEV database
```

## Conventions

Comments say why a test looks unusual, never what the code does. A test that pins a
known bug rather than the intended behaviour says so — `grep -rn "Known bug"`.
