import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../..');
const PROJECT = 'shareframe-test';

const composeArgs = [
  'compose',
  '-p',
  PROJECT,
  '-f',
  path.join(REPO_ROOT, 'docker-compose.test.yml'),
  '--env-file',
  path.join(REPO_ROOT, '.env.test'),
];

// app-command.sh is bypassed on purpose: it edits the env file in place and
// restarts monitoring services this stack does not define.
const compose = async (args: string[], timeout = 15 * 60_000) => {
  const { stdout, stderr } = await run('docker', [...composeArgs, ...args], {
    cwd: REPO_ROOT,
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  return `${stdout}${stderr}`;
};

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
  await compose(['down', '-v', '--remove-orphans'], 5 * 60_000);
};
