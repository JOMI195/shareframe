const WebSocket = require('ws');
const { authHeaders, serial } = require('./ed25519.js');
const { buildHeartbeat } = require('./heartbeat.js');

const OBTAIN_TOKEN_PATH = '/api/frames/obtain-frame-token/';
const HEARTBEAT_PATH = '/api/frames/frame-hearbeat/';
const WS_PATH = '/ws/frames/';

const WS_CLOSE_AUTH_REJECTED = 4001;
const WS_CLOSE_TOKEN_REVOKED = 4002;

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 180000;
const TOKEN_REFRESH_THRESHOLD = 5;

const DEFAULTS = {
  durationSecs: 120,
  pingSecs: 30,
  heartbeatSecs: 300,
  expiryCheckSecs: 900,
  heartbeatAtStart: false,
  version: '7.0.0',
  osSha: '1731730',
  appSha: '5ece601',
  localIp: '192.168.0.10',
  log: true
};

module.exports = async function runFrameSim(options) {
  const cfg = { ...DEFAULTS, ...options };
  if (!cfg.seedB64) throw new Error('frame-sim: seedB64 (ed25519 private key) is required');

  const httpBase = cfg.httpDomain.replace(/\/$/, '');
  const wsUrl = cfg.wsDomain.replace(/\/$/, '') + WS_PATH;
  const frameId = cfg.frameId || serial(cfg.seedB64);

  const log = (...args) => cfg.log && console.log('[frame-sim]', ...args);

  const stats = {
    frameId,
    sent: {},
    received: {},
    reconnects: 0,
    tokenFetches: 0,
    heartbeats: { ok: 0, failed: 0 },
    errors: []
  };
  const count = (bucket, type) => { bucket[type] = (bucket[type] || 0) + 1; };

  const imageIds = new Set(cfg.initialImageIds || []);
  const imageExpiry = new Map();

  let token = null;
  let ws = null;
  let stopping = false;
  let failedReconnects = 0;
  const timers = [];

  async function fetchToken() {
    const res = await fetch(httpBase + OBTAIN_TOKEN_PATH, {
      method: 'POST',
      headers: authHeaders(cfg.seedB64, frameId),
      body: '{}'
    });
    if (!res.ok) throw new Error(`token fetch failed: HTTP ${res.status}`);
    const body = await res.json();
    stats.tokenFetches += 1;
    log(`token obtained, expires at ${body.expires_at}`);
    return body.access_token;
  }

  function send(payload) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    count(stats.sent, payload.type);
    log(`sent ${payload.type}`);
    return true;
  }

  function onMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      stats.errors.push('non-JSON message received');
      return;
    }
    const type = msg.type || 'unknown';
    count(stats.received, type);

    if (type === 'picture') {
      if (msg.sent_image_id != null) {
        imageIds.add(msg.sent_image_id);
        if (msg.expiry_unix_timestamp != null) imageExpiry.set(msg.sent_image_id, msg.expiry_unix_timestamp);
      }
      log(`picture from ${msg.sender} (id=${msg.sent_image_id}, ${(msg.data || '').length} b64 chars)`);
    } else if (type === 'clear_specific_sent_images') {
      for (const id of msg.sent_image_ids || []) {
        imageIds.delete(id);
        imageExpiry.delete(id);
      }
      log(`cleared ${(msg.sent_image_ids || []).length} images, ${imageIds.size} left`);
    } else if (type === 'clear_display') {
      imageIds.clear();
      imageExpiry.clear();
      log('display cleared');
    } else {
      log(`received ${type}`);
    }
  }

  async function refreshToken() {
    try {
      token = await fetchToken();
    } catch (e) {
      stats.errors.push(e.message);
      log(e.message);
    }
  }

  function connect() {
    ws = new WebSocket(wsUrl, {
      headers: {
        Authorization: `Frame-Access-Token ${token}`,
        Origin: cfg.origin || cfg.wsDomain
      },
      handshakeTimeout: 60000
    });

    ws.on('open', () => {
      failedReconnects = 0;
      log(`connected as ${frameId}`);
      send({ type: 'check_missing_images', sent_image_ids: [...imageIds] });
    });

    ws.on('message', onMessage);

    ws.on('error', (err) => {
      stats.errors.push(err.message);
      log(`error: ${err.message}`);
    });

    ws.on('close', async (code, reason) => {
      if (stopping) return;
      stats.reconnects += 1;
      log(`disconnected: code=${code} reason=${reason}`);

      if (code === WS_CLOSE_AUTH_REJECTED || code === WS_CLOSE_TOKEN_REVOKED) {
        failedReconnects = 0;
        await refreshToken();
      } else if (++failedReconnects >= TOKEN_REFRESH_THRESHOLD) {
        failedReconnects = 0;
        await refreshToken();
      }

      const wait = Math.min(RECONNECT_MIN_MS * 2 ** failedReconnects, RECONNECT_MAX_MS);
      const t = setTimeout(() => { if (!stopping) connect(); }, wait);
      timers.push(t);
    });
  }

  async function sendHeartbeat() {
    try {
      const res = await fetch(httpBase + HEARTBEAT_PATH, {
        method: 'POST',
        headers: {
          Authorization: `Frame-Access-Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildHeartbeat({
          frameId,
          localIp: cfg.localIp,
          version: cfg.version,
          osSha: cfg.osSha,
          appSha: cfg.appSha,
          overrides: cfg.heartbeatOverrides
        }))
      });
      if (res.status === 401) {
        stats.heartbeats.failed += 1;
        log('heartbeat unauthorized, refreshing token');
        await refreshToken();
        return;
      }
      if (!res.ok) {
        stats.heartbeats.failed += 1;
        log(`heartbeat failed: HTTP ${res.status}`);
        return;
      }
      stats.heartbeats.ok += 1;
      log(`heartbeat acknowledged (${res.status})`);
    } catch (e) {
      stats.heartbeats.failed += 1;
      stats.errors.push(e.message);
    }
  }

  const every = (secs, fn) => {
    if (!secs || secs <= 0) return;
    timers.push(setInterval(fn, secs * 1000));
  };

  token = await fetchToken();
  if (cfg.heartbeatAtStart) await sendHeartbeat();
  connect();

  every(cfg.pingSecs, () => send({ type: 'ping', timestamp: Math.floor(Date.now() / 1000) }));
  every(cfg.heartbeatSecs, sendHeartbeat);
  every(cfg.expiryCheckSecs, () => send({
    type: 'check_sent_images_expiry',
    user_frame_images: [...imageIds].map((id) => ({
      sent_image_id: id,
      expires_at: imageExpiry.get(id) ?? 0
    }))
  }));

  await new Promise((resolve) => timers.push(setTimeout(resolve, cfg.durationSecs * 1000)));

  stopping = true;
  timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close(1000, 'sim finished');

  stats.imageIds = [...imageIds];
  log('finished', JSON.stringify({ ...stats, token: undefined }));
  stats.token = token;
  return stats;
};
