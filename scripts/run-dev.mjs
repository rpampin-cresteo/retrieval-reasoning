#!/usr/bin/env node
import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScriptInvocation, detectPackageManager } from './utils/package-managers.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const searchDir = path.join(projectRoot, 'packages', '05-search');
const chatDir = path.join(projectRoot, 'packages', '06-chat');
const widgetDir = path.join(projectRoot, 'packages', '07-widget');

const parsePort = (value, fallback) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const checkPortAvailability = async (port) => {
  const hosts = ['0.0.0.0', '127.0.0.1'];

  for (const host of hosts) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve, reject) => {
      const tester = net.createServer();
      tester.once('error', (error) => {
        tester.close(() => {
          reject(error);
        });
      });
      tester.once('listening', () => {
        tester.close(() => {
          resolve();
        });
      });
      tester.listen(port, host);
    });
  }
};

const acquirePort = async (preferredPort, label) => {
  try {
    await checkPortAvailability(preferredPort);
    return preferredPort;
  } catch (error) {
    if (error.code !== 'EADDRINUSE') {
      throw error;
    }
    console.warn(
      `[dev] ${label} port ${preferredPort} is busy, selecting an open port automatically`
    );
  }

  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      server.close(() => {
        reject(err);
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address !== 'object') {
        server.close(() => {
          reject(new Error('Failed to obtain dynamic port'));
        });
        return;
      }
      const { port } = address;
      server.close(() => {
        console.warn(`[dev] ${label} reassigned to port ${port}`);
        resolve(port);
      });
    });
  });
};

const resolvePorts = async () => {
  const desiredSearchPort = parsePort(process.env.SEARCH_PORT, 3001);
  const assignedSearchPort = await acquirePort(desiredSearchPort, 'search service');

  const desiredChatPort = parsePort(process.env.CHAT_PORT, 3002);
  const assignedChatPort = await acquirePort(desiredChatPort, 'chat service');

  const desiredWidgetPort = parsePort(process.env.WIDGET_PORT, 3003);
  const assignedWidgetPort = await acquirePort(desiredWidgetPort, 'widget');

  const desiredGatewayPort = parsePort(process.env.GATEWAY_PORT, 4000);
  const assignedGatewayPort = await acquirePort(desiredGatewayPort, 'gateway');

  const ports = {
    searchPort: String(assignedSearchPort),
    chatPort: String(assignedChatPort),
    widgetPort: String(assignedWidgetPort),
    gatewayPort: String(assignedGatewayPort)
  };

  process.env.SEARCH_PORT = ports.searchPort;
  process.env.CHAT_PORT = ports.chatPort;
  process.env.WIDGET_PORT = ports.widgetPort;
  process.env.GATEWAY_PORT = ports.gatewayPort;

  return ports;
};

const children = [];
let shuttingDown = false;

const resolveInvocation = async (dir, scriptName, extraArgs = []) => {
  const manager = await detectPackageManager(dir);
  const { command, args } = buildScriptInvocation(manager, scriptName, extraArgs);
  return { command, args };
};

const spawnManaged = async (name, dir, scriptName, extraArgs, extraEnv) => {
  const { command, args } = await resolveInvocation(dir, scriptName, extraArgs);
  console.log(`[dev:${name}] launching: ${command} ${args.join(' ')}`);
  const child = spawn(command, args, {
    cwd: dir,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
    windowsHide: false,
    shell: process.platform === 'win32'
  });

  child.on('error', (error) => {
    console.error(`[dev:${name}] failed to start`, error);
    initiateShutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.warn(`[dev:${name}] exited unexpectedly (${reason})`);
    initiateShutdown(code ?? 1);
  });

  children.push({ name, child });
};

const spawnGateway = ({ gatewayPort, searchPort, chatPort, widgetPort }) => {
  const child = spawn('node', ['apps/gateway/index.mjs'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ENABLE_DEV_UI: 'true',
      GATEWAY_PORT: gatewayPort,
      SEARCH_PORT: searchPort,
      CHAT_PORT: chatPort,
      WIDGET_PORT: widgetPort
    },
    stdio: 'inherit',
    windowsHide: false,
    shell: process.platform === 'win32'
  });

  child.on('error', (error) => {
    console.error('[dev:gateway] failed to start', error);
    initiateShutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    console.warn(`[dev:gateway] exited unexpectedly (${reason})`);
    initiateShutdown(code ?? 1);
  });

  children.push({ name: 'gateway', child });
};

const terminateChild = (entry) => {
  const { child, name } = entry;
  if (!child || child.killed) {
    return;
  }
  console.log(`[dev] stopping ${name}...`);
  try {
    child.kill('SIGTERM');
  } catch (error) {
    console.error(`[dev] failed to terminate ${name}:`, error);
  }
};

const initiateShutdown = (code) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const entry of children) {
    terminateChild(entry);
  }
  setTimeout(() => {
    process.exit(code);
  }, 1000);
};

const main = async () => {
  const { searchPort, chatPort, widgetPort, gatewayPort } = await resolvePorts();

  const searchBaseUrl = `http://127.0.0.1:${searchPort}`;
  const chatApiUrl = `http://127.0.0.1:${chatPort}/api/chat`;
  const widgetBaseUrl = `http://127.0.0.1:${widgetPort}`;

  if (process.env.SEARCH_BASE_URL && process.env.SEARCH_BASE_URL !== searchBaseUrl) {
    console.warn(
      `[dev] overriding SEARCH_BASE_URL to ${searchBaseUrl} (was ${process.env.SEARCH_BASE_URL})`
    );
  }

  process.env.SEARCH_BASE_URL = searchBaseUrl;
  process.env.CHAT_API_URL = chatApiUrl;
  process.env.WIDGET_BASE_URL = widgetBaseUrl;

  const allowedOrigins = [
    searchBaseUrl,
    `http://127.0.0.1:${chatPort}`,
    widgetBaseUrl,
    `http://127.0.0.1:${gatewayPort}`
  ];
  process.env.ALLOWED_ORIGINS = Array.from(new Set(allowedOrigins)).join(',');

  await spawnManaged('search', searchDir, 'dev', [], {
    PORT: searchPort,
    NODE_ENV: 'development'
  });

  await spawnManaged('chat', chatDir, 'dev', [], {
    PORT: chatPort,
    NODE_ENV: 'development',
    SEARCH_BASE_URL: searchBaseUrl
  });

  await spawnManaged('widget', widgetDir, 'dev', [], {
    PORT: widgetPort,
    NODE_ENV: 'development',
    CHAT_API_URL: chatApiUrl,
    WIDGET_BASE_URL: widgetBaseUrl,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
  });

  spawnGateway({ searchPort, chatPort, widgetPort, gatewayPort });
};

process.on('SIGINT', () => {
  console.log('\n[dev] Caught SIGINT, shutting down...');
  initiateShutdown(0);
});
process.on('SIGTERM', () => {
  console.log('\n[dev] Caught SIGTERM, shutting down...');
  initiateShutdown(0);
});

main().catch((error) => {
  console.error('[dev] failed to launch services:', error);
  initiateShutdown(1);
});
