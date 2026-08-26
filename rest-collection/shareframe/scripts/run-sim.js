#!/usr/bin/env node
// Standalone driver for long runs: node scripts/run-sim.js --duration 3600 --heartbeat-at-start true --initial-image-ids '[1,2]'
const runFrameSim = require('./frame-sim.js');

const args = process.argv.slice(2).reduce((acc, arg, i, all) => {
  if (arg.startsWith('--')) acc[arg.slice(2)] = all[i + 1];
  return acc;
}, {});

const num = (v, fallback) => (v == null ? fallback : Number(v));
const bool = (v, fallback) => {
  if (v == null || v === '') return fallback;
  const normalized = String(v).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`invalid boolean value: ${v}`);
};
const parseIds = (raw) => {
  if (raw == null || raw === '') return undefined;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('initial image ids must be a JSON array');
  return parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value));
};

runFrameSim({
  httpDomain: args.http || process.env.SIM_HTTP_DOMAIN || 'http://localhost:8000',
  wsDomain: args.ws || process.env.SIM_WS_DOMAIN || 'ws://localhost:8000',
  seedB64: args.seed || process.env.SIM_ED25519_PRIVATE_KEY,
  version: args.version || process.env.SIM_FRAME_VERSION || '7.0.0',
  osSha: args.osSha || process.env.SIM_OS_SHA || '1731730',
  appSha: args.appSha || process.env.SIM_APP_SHA || '5ece601',
  localIp: args.ip || process.env.SIM_LOCAL_IP || '192.168.0.10',
  durationSecs: num(args.duration, 300),
  pingSecs: num(args.ping, 30),
  heartbeatSecs: num(args.heartbeat, 300),
  heartbeatAtStart: bool(args['heartbeat-at-start'] ?? process.env.SIM_HEARTBEAT_AT_START, false),
  expiryCheckSecs: num(args.expiry, 900),
  initialImageIds: parseIds(args['initial-image-ids'] || process.env.SIM_INITIAL_SENT_IMAGE_IDS)
})
  .then((stats) => {
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
