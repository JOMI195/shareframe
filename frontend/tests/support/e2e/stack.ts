import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const PROJECT = 'shareframe-test';

export const monitoringEnabled = () => process.env.E2E_MONITORING === '1';

const composeArgs = [
  'compose',
  '-p',
  PROJECT,
  '-f',
  path.join(REPO_ROOT, 'docker-compose.test.yml'),
  '--env-file',
  path.join(REPO_ROOT, '.env.test'),
];

// Teardown always names the profile, so `down -v` also removes a monitoring run's containers.
const profile = (all: boolean) => (all || monitoringEnabled() ? ['--profile', 'monitoring'] : []);

// app-command.sh is bypassed on purpose: it edits the env file in place and
// restarts services by their prod names.
const compose = async (args: string[], timeout = 15 * 60_000, allProfiles = false) => {
  const { stdout, stderr } = await run('docker', [...composeArgs, ...profile(allProfiles), ...args], {
    cwd: REPO_ROOT,
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  return `${stdout}${stderr}`;
};

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8100/api';

// The monitoring profile's gateway, so traffic shows up in the nginx and daphne logs too.
export const NGINX_URL = process.env.E2E_NGINX_URL ?? 'http://localhost:8180';

export const stackIsExternal = () => process.env.E2E_NO_STACK === '1';

export const startStack = async () => {
  if (stackIsExternal()) {
    console.log('[e2e] E2E_NO_STACK=1, using the stack that is already running');
    return;
  }

  console.log('[e2e] starting the shared test stack (fresh database, seeded)');
  await compose(['up', '-d', '--build', '--wait']);
};

export const stopStack = async () => {
  if (stackIsExternal()) return;

  if (process.env.E2E_KEEP_STACK === '1') {
    console.log(`[e2e] E2E_KEEP_STACK=1, leaving ${PROJECT} running`);
    return;
  }

  console.log('[e2e] destroying the shared test stack');
  await compose(['down', '-v', '--remove-orphans'], 5 * 60_000, true);
};

export const composeExec = async (service: string, command: string[]) =>
  compose(['exec', '-T', service, ...command], 2 * 60_000);

// For work that only a schedule triggers; everything else goes through the UI.
export const runInBackend = async (code: string) => composeExec('backend', ['python', 'manage.py', 'shell', '-c', code]);

export interface ComposeContainer {
  Name: string;
  Service: string;
  State: string;
  Health: string;
}

export const composeContainers = async () =>
  (await compose(['ps', '--format', 'json'], 60_000))
    .split('\n')
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line) as ComposeContainer);

/** Engine-wide container counts, what telegraf's docker summary reports. */
export const dockerContainerCounts = async () => {
  const { stdout } = await run('docker', ['info', '--format', '{{.ContainersRunning}} {{.ContainersStopped}}']);
  const [running, stopped] = stdout.trim().split(' ').map(Number);
  return { running, stopped };
};
