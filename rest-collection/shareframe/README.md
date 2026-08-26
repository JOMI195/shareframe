# shareframe Bruno collection

Requests for the shareframe backend, plus a frame traffic simulator that makes the
backend see what a real Pi frame sends.

## Auto-seeded dev/local test data

When backend containers start with `PRODUCTION=False` (dev + local-prod compose), the
entrypoint now runs `python manage.py seed_dev_data` after migrations and image-size
setup. That command creates deterministic test entities if missing:

- users/accounts: `seed_alice`, `seed_bob`, `seed_carol`
- frames: `JHTT-XDS6-MM7D-UMOM` (main), `NUZW-6WOC-DVCE-WMOQ` (office)
- frame groups: `Seed Living Room`, `Seed Office`
- images: `seed_alice_sunrise`, `seed_alice_forest`, `seed_carol_ocean`
- friendships: accepted edges for seeded sharing flows
- sent images: active + expired examples to exercise frame sync behavior

Seed definitions live in `backend/seed_assets/dev_seed_data.json` and source images
live in `backend/seed_assets/images`.
Seed user passwords are deterministic too:
`seed-alice-dev-pass`, `seed-bob-dev-pass`, `seed-carol-dev-pass`.

## Frame simulation

| What | Where | Use for |
|---|---|---|
| Message palette | `frames-websocket/frame-session` | hand-sending single frame→server WS messages |
| Session simulator | `frames-websocket/simulate-frame` | autonomous session with the real cadence |
| Shell driver | `scripts/run-sim.js` | long / unattended runs, load for Grafana panels |
| Heartbeats | `frames-http/send-heartbeat*` | sysinfo payload by hand or freshly generated |

### 1. One-time setup

```bash
cd rest-collection/shareframe
npm install          # pulls ws; node_modules is gitignored
```

In the Bruno app:

1. Collection settings → enable **Developer Mode** (`require()` is unavailable without it).
2. Pick the environment: **dev** (`docker-compose.dev.yml`, port 8000) or **local-prod**
   (`docker-compose.prod.local.yml`, nginx on port 80).
3. Use the prefilled seeded defaults (`frame_ed25519_private_key`,
   `frame_public_serial_number`) for immediate simulation against seeded backend data.
4. Optional: override those vars if you want to target a custom frame identity.

The prefilled seed points to frame `JHTT-XDS6-MM7D-UMOM`, which is created by
`seed_dev_data`. Without a valid provisioned frame (matching key + assigned user +
`is_active=True`) the WS middleware closes the connection with code 4001.

### 2. Palette — send single messages by hand

1. Run `frames-http/frame-auth-token/obtain`. Its pre-request script signs
   `"<serial>:<unix_ts>"` with the seed and stores the token in `frame_access_token`.
2. Open `frames-websocket/frame-session` → **Connect**.
3. Pick a message tab and send it:

   | Message | Backend reaction |
   |---|---|
   | `check_missing_images` | pushes every non-expired image the frame does not list, clears stale ids |
   | `check_sent_images_expiry` | resends images with mismatched expiry, clears expired/unknown ids |
   | `ping` | answers `pong` with the same timestamp |
   | `config` | updates the frame's `local_ip_address` and `version` |
   | `heartbeat` | logged only (the C++ board uses the HTTP heartbeat instead) |
   | `close_connection` | server closes with 4002 |
   | `unknown-type` | logged as unhandled — exercises the warn path |

`keepAliveInterval` is 30000 ms, matching the board's protocol ping.
Tokens last 7 days; re-run `obtain` after a 4001/4002 close.

### 3. Simulator — a whole session, unattended

Run `frames-websocket/simulate-frame`. Its pre-request script drives one full frame
lifecycle, then the request verifies the token the session used and its tests assert
the session was clean.

What it reproduces:

- token fetch, and re-fetch on 401 / close 4001 / 4002 / 5 failed reconnects
- WS connect with `Frame-Access-Token`, `check_missing_images` on every open
- app-level `ping`, HTTP heartbeat with the board's payload shape, `check_sent_images_expiry`
- incoming `picture` / `clear_specific_sent_images` / `clear_display` tracked in an
  in-memory image set, so later expiry checks carry realistic ids
- reconnect with 1 s → 180 s exponential backoff

Cadence comes from environment variables (`0` disables a timer):

| Var | Default | Mirrors |
|---|---|---|
| `sim_duration_secs` | 120 | how long the session runs |
| `sim_ping_secs` | 30 | `WebsocketClient` ping interval |
| `sim_heartbeat_secs` | 300 | `config.toml [heartbeat] interval_secs` |
| `sim_heartbeat_at_start` | true | send one heartbeat immediately at simulator startup |
| `sim_expiry_secs` | 900 | `config.toml [expiry_cleanup] interval_secs` |
| `sim_frame_version` | 7.0.0 | reported release version (the semver the OTA compare uses) |
| `sim_os_sha` | 1731730 | reported `shareframe-hardware` commit |
| `sim_app_sha` | 5ece601 | reported `shareframe-board` commit |
| `sim_local_ip` | 192.168.0.10 | reported LAN address |
| `sim_initial_sent_image_ids` | `[]` | initial frame-side image id cache (`JSON` array) |

Bruno blocks while the script runs, so keep `sim_duration_secs` short (≤ 300) in the
app. Progress appears in the Bruno console as `[frame-sim] …` lines. The run returns
counters (`sent`, `received`, `reconnects`, `heartbeats`, `errors`) into the
`sim_stats` runtime var, and refreshes `frame_access_token`.

For a quick end-to-end check, start the simulator, then send an image to the frame's
user with `frames-http/send-image` — the console logs the incoming `picture`.
That request defaults to seeded users (`seed_alice` → `seed_bob`) and env helpers.

### 4. Heartbeats with the full sysinfo payload

The board posts far more than ip and version: health state, boot count and slot,
uptime, kernel, cpu temperature / usage / frequency, load averages, ram and storage
(`Heartbeat::execute`). Three ways to send that:

| How | Request | Payload |
|---|---|---|
| manual | `frames-http/send-heartbeat` | literal JSON, every field editable in the body |
| generated | `frames-http/send-heartbeat-generated` | rebuilt per send: current `time_iso`, uptime, jittered cpu / ram / storage |
| automatic | `frames-websocket/simulate-frame`, `scripts/run-sim.js` | same builder, every `sim_heartbeat_secs` |

The generated request and the simulator share `scripts/heartbeat.js`, so manual and
automatic heartbeats never drift apart. Pin individual fields with the env var
`sim_heartbeat_overrides`:

```json
{"boot_count": 42, "health_state": "degraded", "boot_slot": "B", "load_1": 3.9}
```

All three need a token (`frames-http/frame-auth-token/obtain`); the generated one also
needs Developer Mode.

Note: `frames/views.py::frame_hearbeat` currently persists only `local_ip_address` and
`version` — the sysinfo block is accepted and dropped. It still reaches the request log,
so these requests are how you drive the server side while it is being built.

### 5. Long runs from the shell

Same module, no Bruno, nothing blocked:

```bash
node scripts/run-sim.js \
  --http http://127.0.0.1 --ws ws://127.0.0.1 \
  --seed <base64-seed> \
  --duration 3600 --ping 30 --heartbeat 300 --heartbeat-at-start true --expiry 900 \
  --initial-image-ids '[1,2,3]'
```

Also `--version`, `--ip`. Env vars `SIM_HTTP_DOMAIN`, `SIM_WS_DOMAIN`,
`SIM_ED25519_PRIVATE_KEY`, `SIM_FRAME_VERSION`, `SIM_LOCAL_IP`,
`SIM_HEARTBEAT_AT_START`, and `SIM_INITIAL_SENT_IMAGE_IDS` work as defaults.
Counters print as JSON on exit.

Headless collection run:

```bash
npx @usebruno/cli run frames-websocket/simulate-frame.yml --env local-prod \
  --sandbox developer --env-var frame_ed25519_private_key='<seed>'
```

The CLI cannot run WebSocket requests (`Unsupported protocol ws:`) — `frame-session`
only works in the app.

### 5.1 Local-prod (localhost) CLI commands

From the repository root, start local-prod:

```bash
docker compose -f docker-compose.prod.local.yml up --build -d
```

Optional: re-run deterministic seed data in the running backend container:

```bash
docker compose -f docker-compose.prod.local.yml exec backend python manage.py seed_dev_data
```

Run simulator traffic from `rest-collection/shareframe`:

```bash
cd rest-collection/shareframe
npm install
```

Seeded frame A (normal cadence):

```bash
node scripts/run-sim.js \
  --http http://localhost --ws ws://localhost \
  --seed 'GsmLsUiA7A8V5FM8dCj30jxqSZyh29kaUFheJDTFqtQ=' \
  --duration 900 --ping 30 --heartbeat 300 --heartbeat-at-start true --expiry 900 \
  --initial-image-ids '[]'
```

Seeded frame B (more chatty cadence):

```bash
node scripts/run-sim.js \
  --http http://localhost --ws ws://localhost \
  --seed 'eENYNI2gTamRkXmvtQDm0pGDoQcmqXCAso3JxH5o1SQ=' \
  --duration 900 --ping 10 --heartbeat 60 --heartbeat-at-start true --expiry 120 \
  --initial-image-ids '[9999,8888]'
```

Inject image traffic (seed user Alice -> Bob):
(`jq` is used below to extract JSON values)

```bash
TOKEN="$(curl -sS -X POST http://localhost/api/auth/jwt/create/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"seed.alice@shareframe.local","password":"seed-alice-dev-pass"}' | jq -r '.access')"

IMAGE_ID="$(curl -sS http://localhost/api/images/ \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results[0].id')"

curl -sS -X POST http://localhost/api/frames/send-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"reciever_username\":\"seed_bob\",\"image_id\":${IMAGE_ID},\"expiry_unix_timestamp\":4102444800}"
```

Stop local-prod:

```bash
docker compose -f docker-compose.prod.local.yml down
```

### Files

```
scripts/ed25519.js    signing + serial derivation, shared by the requests and the sim
scripts/heartbeat.js  heartbeat payload builder, shared by the request and the sim
scripts/frame-sim.js  the session loop (free of bru.* so it also runs under plain node)
scripts/run-sim.js    shell entry point
```
