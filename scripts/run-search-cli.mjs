#!/usr/bin/env node
import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScriptInvocation, detectPackageManager } from './utils/package-managers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const extraArgs = process.argv.slice(2);
const searchDir = path.join(projectRoot, 'packages', '05-search');

const main = async () => {
  const manager = await detectPackageManager(searchDir);
  const { command, args } = buildScriptInvocation(manager, 'start', extraArgs);

  const child = spawn(command, args, {
    cwd: searchDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.SEARCH_PORT ?? process.env.PORT ?? '5050'
    },
    stdio: 'inherit',
    windowsHide: false
  });

  child.on('exit', (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[search:cli] process exited (${reason})`);
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[search:cli] failed to launch', error);
    process.exit(1);
  });
};

main().catch((error) => {
  console.error('[search:cli] unexpected error:', error);
  process.exit(1);
});
