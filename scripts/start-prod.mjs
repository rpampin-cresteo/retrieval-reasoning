#!/usr/bin/env node
import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const gatewayPort = process.env.GATEWAY_PORT ?? '4000';
const searchPort = process.env.SEARCH_PORT ?? '5050';
const chatPort = process.env.CHAT_PORT ?? '6060';

const child = spawn('node', ['apps/gateway/index.mjs'], {
  cwd: projectRoot,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    ENABLE_DEV_UI: 'false',
    GATEWAY_PORT: gatewayPort,
    SEARCH_PORT: searchPort,
    CHAT_PORT: chatPort
  },
  stdio: 'inherit',
  windowsHide: false
});

child.on('exit', (code, signal) => {
  const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
  console.log(`[start] gateway process exited (${reason})`);
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[start] failed to start gateway', error);
  process.exit(1);
});
