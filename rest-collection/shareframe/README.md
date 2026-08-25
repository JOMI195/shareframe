# shareframe Bruno collection

Requests for the shareframe backend, plus a frame traffic simulator that makes the
backend see what a real Pi frame sends.

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
3. Environment editor → set `frame_ed25519_private_key` to the frame's 32-byte ed25519
   seed, base64 — the same value as `ed25519_private_key` in that board's
   `.env.secrets.toml`. It is a secret var, so it never lands in git.
4. Leave `frame_public_serial_number` empty; the serial is derived from the seed the
   same way the board and backend derive it (`FrameIdentity::fingerprint` /
   `frames.keys.public_key_fingerprint`). Set it only to override.

The frame must exist in the target backend: a `Frame` row with `public_key` = base64
ed25519 **public** key, `public_serial_number` = fingerprint of that key, a user
assigned and `is_active=True`. Without it the WS middleware closes the connection with
code 4001. Fresh keypair: `shareframe-hardware/scripts/gen-dev-keys.sh`.

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
| `sim_expiry_secs` | 900 | `config.toml [expiry_cleanup] interval_secs` |
| `sim_frame_version` | 7.0.0 | reported version |
| `sim_local_ip` | 192.168.0.10 | reported LAN address |

Bruno blocks while the script runs, so keep `sim_duration_secs` short (≤ 300) in the
app. Progress appears in the Bruno console as `[frame-sim] …` lines. The run returns
counters (`sent`, `received`, `reconnects`, `heartbeats`, `errors`) into the
`sim_stats` runtime var, and refreshes `frame_access_token`.

For a quick end-to-end check, start the simulator, then send an image to the frame's
user with `frames-http/send-image` — the console logs the incoming `picture`.

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
  --duration 3600 --ping 30 --heartbeat 300 --expiry 900
```

Also `--version`, `--ip`. Env vars `SIM_HTTP_DOMAIN`, `SIM_WS_DOMAIN`,
`SIM_ED25519_PRIVATE_KEY`, `SIM_FRAME_VERSION`, `SIM_LOCAL_IP` work as defaults.
Counters print as JSON on exit.

Headless collection run:

```bash
npx @usebruno/cli run frames-websocket/simulate-frame.yml --env local-prod \
  --sandbox developer --env-var frame_ed25519_private_key='<seed>'
```

The CLI cannot run WebSocket requests (`Unsupported protocol ws:`) — `frame-session`
only works in the app.

### Files

```
scripts/ed25519.js    signing + serial derivation, shared by the requests and the sim
scripts/heartbeat.js  heartbeat payload builder, shared by the request and the sim
scripts/frame-sim.js  the session loop (free of bru.* so it also runs under plain node)
scripts/run-sim.js    shell entry point
```
