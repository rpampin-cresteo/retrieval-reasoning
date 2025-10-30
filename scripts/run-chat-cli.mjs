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
const chatDir = path.join(projectRoot, 'packages', '06-chat');

const main = async () => {
  const manager = await detectPackageManager(chatDir);
  const { command, args } = buildScriptInvocation(manager, 'start', extraArgs);

  const child = spawn(command, args, {
    cwd: chatDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.CHAT_PORT ?? process.env.PORT ?? '6060',
      SEARCH_BASE_URL: process.env.SEARCH_BASE_URL ?? `http://127.0.0.1:${process.env.SEARCH_PORT ?? '5050'}`
    },
    stdio: 'inherit',
    windowsHide: false
  });

  child.on('exit', (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.log(`[chat:cli] process exited (${reason})`);
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[chat:cli] failed to launch', error);
    process.exit(1);
  });
};

main().catch((error) => {
  console.error('[chat:cli] unexpected error:', error);
  process.exit(1);
});
