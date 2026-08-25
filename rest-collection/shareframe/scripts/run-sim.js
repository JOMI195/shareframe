#!/usr/bin/env node
// Standalone driver for long runs: node scripts/run-sim.js --duration 3600
const runFrameSim = require('./frame-sim.js');

const args = process.argv.slice(2).reduce((acc, arg, i, all) => {
  if (arg.startsWith('--')) acc[arg.slice(2)] = all[i + 1];
  return acc;
}, {});

const num = (v, fallback) => (v == null ? fallback : Number(v));

runFrameSim({
  httpDomain: args.http || process.env.SIM_HTTP_DOMAIN || 'http://localhost:8000',
  wsDomain: args.ws || process.env.SIM_WS_DOMAIN || 'ws://localhost:8000',
  seedB64: args.seed || process.env.SIM_ED25519_PRIVATE_KEY,
  version: args.version || process.env.SIM_FRAME_VERSION || '7.0.0',
  localIp: args.ip || process.env.SIM_LOCAL_IP || '192.168.0.10',
  durationSecs: num(args.duration, 300),
  pingSecs: num(args.ping, 30),
  heartbeatSecs: num(args.heartbeat, 300),
  expiryCheckSecs: num(args.expiry, 900)
})
  .then((stats) => {
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
