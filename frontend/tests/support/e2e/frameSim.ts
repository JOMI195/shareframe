import { createRequire } from 'node:module';
import path from 'node:path';
import { NGINX_URL } from './stack';

// The simulator and its `ws` dependency live in the Bruno collection, shared with its requests.
const SCRIPTS = path.resolve(import.meta.dirname, '../../../../rest-collection/shareframe/scripts');
const requireScript = createRequire(path.join(SCRIPTS, 'frame-sim.js'));

const load = <T>(id: string): T => {
  try {
    return requireScript(id) as T;
  } catch (error) {
    if (error instanceof Error) error.message = `${error.message}; run \`npm install\` in rest-collection/shareframe`;
    throw error;
  }
};

type Telemetry = Record<string, unknown>;

interface SimOptions {
  httpDomain: string;
  wsDomain: string;
  seedB64: string;
  durationSecs: number;
  pingSecs: number;
  heartbeatSecs: number;
  heartbeatAtStart: boolean;
  expiryCheckSecs: number;
  heartbeatOverrides?: Telemetry;
  log: boolean;
}

export interface SimStats {
  frameId: string;
  sent: Record<string, number>;
  received: Record<string, number>;
  reconnects: number;
  heartbeats: { ok: number; failed: number };
  errors: string[];
  token: string;
}

interface WebSocketLike {
  on(event: 'close', listener: (code: number) => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'open', listener: () => void): void;
  on(event: 'unexpected-response', listener: (request: unknown, response: { statusCode: number }) => void): void;
  send(data: string): void;
}

const runFrameSim = load<(options: SimOptions) => Promise<SimStats>>('./frame-sim.js');
const { buildHeartbeat } = load<{ buildHeartbeat: (options: Telemetry) => Telemetry }>('./heartbeat.js');
const { authHeaders } = load<{ authHeaders: (seedB64: string) => Record<string, string> }>('./ed25519.js');
const WebSocket = load<new (url: string, options: { headers: Record<string, string> }) => WebSocketLike>('ws');

const WS_ORIGIN = NGINX_URL.replace(/^http/, 'ws');
const WS_URL = `${WS_ORIGIN}/ws/frames/`;

// The origin validator turns away sockets without one, as the board always sends it.
const openSocket = (token: string) =>
  new WebSocket(WS_URL, { headers: { Authorization: `Frame-Access-Token ${token}`, Origin: WS_ORIGIN } });

/** One session with the board's cadence: token, websocket, a heartbeat at start, pings. */
export const runFrameSession = (seedB64: string, durationSecs: number, telemetry: Telemetry) =>
  runFrameSim({
    httpDomain: NGINX_URL,
    wsDomain: WS_ORIGIN,
    seedB64,
    durationSecs,
    pingSecs: 5,
    heartbeatSecs: 0,
    heartbeatAtStart: true,
    expiryCheckSecs: 0,
    heartbeatOverrides: telemetry,
    log: false,
  });

export const obtainFrameToken = async (seedB64: string) => {
  const response = await fetch(`${NGINX_URL}/api/frames/obtain-frame-token/`, {
    method: 'POST',
    headers: authHeaders(seedB64),
    body: '{}',
  });
  if (!response.ok) throw new Error(`frame token: HTTP ${response.status}`);
  return ((await response.json()) as { access_token: string }).access_token;
};

/** The board's payload shape with every value pinned, so the dashboards can be checked exactly. */
export const sendHeartbeat = async (seedB64: string, serial: string, telemetry: Telemetry) => {
  const response = await fetch(`${NGINX_URL}/api/frames/frame-hearbeat/`, {
    method: 'POST',
    headers: {
      Authorization: `Frame-Access-Token ${await obtainFrameToken(seedB64)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildHeartbeat({ frameId: serial, overrides: telemetry })),
  });
  if (!response.ok) throw new Error(`heartbeat: HTTP ${response.status} ${await response.text()}`);
};

const closeCode = (socket: WebSocketLike) =>
  new Promise<number>((resolve, reject) => {
    socket.on('close', resolve);
    socket.on('error', reject);
  });

/** HTTP status of a handshake the server refuses; closing before accept() turns into a 403. */
export const rejectedConnection = () =>
  new Promise<number>((resolve, reject) => {
    const socket = openSocket('not-a-valid-token');
    socket.on('unexpected-response', (_request, response) => resolve(response.statusCode));
    socket.on('open', () => reject(new Error('socket with an invalid token was accepted')));
    socket.on('error', reject);
  });

/** Asks the server to close the session, which it does with the token-revoked code. */
export const closeConnection = async (seedB64: string) => {
  const socket = openSocket(await obtainFrameToken(seedB64));
  const closed = closeCode(socket);
  socket.on('open', () => socket.send(JSON.stringify({ type: 'close_connection' })));
  return closed;
};

/** A board entering a wrong one-time code. */
export const rejectedOtp = async (seedB64: string) => {
  const response = await fetch(`${NGINX_URL}/api/frames/verify-otp/`, {
    method: 'POST',
    headers: {
      Authorization: `Frame-Access-Token ${await obtainFrameToken(seedB64)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ otp: '000000' }),
  });
  return response.status;
};

/** A token request for one frame signed with another frame's key. */
export const forgedSignature = async (signingSeedB64: string, serial: string) => {
  const response = await fetch(`${NGINX_URL}/api/frames/obtain-frame-token/`, {
    method: 'POST',
    headers: { ...authHeaders(signingSeedB64), 'X-Frame-ID': serial },
    body: '{}',
  });
  return response.status;
};
