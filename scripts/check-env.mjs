#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { envMetadata } from './env/metadata.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const parseEnv = (content) => {
  const entries = {};
  const lines = content.split(/\r?\n/);
  const regex = /^\s*([A-Z][A-Z0-9_]+)\s*=\s*(.*)\s*$/;
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const match = line.match(regex);
    if (!match) {
      continue;
    }
    const key = match[1];
    let value = match[2] ?? '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
};

const main = async () => {
  const envPath = path.join(projectRoot, '.env');
  let envContent = '';
  try {
    envContent = await fs.readFile(envPath, 'utf8');
  } catch (error) {
    console.error(`[check] Unable to read ${envPath}:`, error.message);
    process.exit(1);
  }

  const envEntries = parseEnv(envContent);
  const requiredKeys = envMetadata.filter((meta) => meta.required).map((meta) => meta.key);

  const missing = [];
  for (const key of requiredKeys) {
    const value = envEntries[key];
    if (!value) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('[check] Missing environment values for:');
    for (const key of missing) {
      console.error(` - ${key}`);
    }
    process.exit(1);
  }

  console.log('[check] All required environment variables are present.');
};

main().catch((error) => {
  console.error('[check] Unexpected error:', error);
  process.exit(1);
});
