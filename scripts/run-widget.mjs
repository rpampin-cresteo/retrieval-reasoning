#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildScriptInvocation, detectPackageManager } from './utils/package-managers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const widgetDir = path.join(projectRoot, 'packages', '07-widget');

const resolveInvocation = async () => {
  const manager = await detectPackageManager(widgetDir);
  return buildScriptInvocation(manager, 'dev');
};

const main = async () => {
  const { command, args } = await resolveInvocation();
  const widgetPort = process.env.WIDGET_PORT ?? '3003';
  const chatApiUrl = process.env.CHAT_API_URL ?? 'http://127.0.0.1:3002/api/chat';
  const widgetBaseUrl = process.env.WIDGET_BASE_URL ?? `http://127.0.0.1:${widgetPort}`;

  const child = spawn(command, args, {
    cwd: widgetDir,
    env: {
      ...process.env,
      PORT: widgetPort,
      NODE_ENV: 'development',
      CHAT_API_URL: chatApiUrl,
      WIDGET_BASE_URL: widgetBaseUrl
    },
    stdio: 'inherit',
    windowsHide: false,
    shell: process.platform === 'win32'
  });

  child.on('error', (error) => {
    console.error('[dev:widget] failed to start', error);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.warn(`[dev:widget] exited with signal ${signal}`);
      process.exit(1);
    } else {
      process.exit(code ?? 0);
    }
  });
};

main().catch((error) => {
  console.error('[dev:widget] unable to launch widget dev server:', error);
  process.exit(1);
});
