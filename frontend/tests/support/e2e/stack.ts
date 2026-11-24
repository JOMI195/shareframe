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

// For work that only a schedule triggers; everything else goes through the UI.
export const runInBackend = async (code: string) =>
  compose(['exec', '-T', 'backend', 'python', 'manage.py', 'shell', '-c', code], 2 * 60_000);
