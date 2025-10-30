#!/usr/bin/env node
import dotenv from 'dotenv';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const nodeEnv = (process.env.NODE_ENV ?? 'development').trim();
const isDevelopment = nodeEnv === 'development';
const enableDevUi =
  isDevelopment && toBoolean(process.env.ENABLE_DEV_UI ?? (isDevelopment ? 'true' : 'false'));

const searchPort = toNumber(process.env.SEARCH_PORT, 5050);
const chatPort = toNumber(process.env.CHAT_PORT, 6060);
const gatewayPort = toNumber(process.env.GATEWAY_PORT, 4000);

const app = express();

const logStartup = () => {
  const modeLabel = `${nodeEnv}${enableDevUi ? ' (dev UI enabled)' : ''}`;
  console.log(`[gateway] Starting in ${modeLabel}`);
  console.log(`[gateway] Listening on http://localhost:${gatewayPort}`);
  if (enableDevUi) {
    console.log(`[gateway] - Dev search UI -> http://localhost:${gatewayPort}/search/dev`);
    console.log(`[gateway] - Dev chat UI   -> http://localhost:${gatewayPort}/chat/dev`);
  } else {
    console.log('[gateway] Developer UIs are disabled (production mode)');
    console.log('[gateway] Use `npm run search:cli` or `npm run chat:cli` for CLI access.');
  }
};

const buildProxy = (routePrefix, targetPort, serviceLabel) => {
  const basePath = routePrefix.endsWith('/') ? routePrefix.slice(0, -1) : routePrefix;

  const rewriteToLocalTest = (originalUrl) => {
    const [pathname, query = ''] = originalUrl.split('?');
    if (!pathname.startsWith(basePath)) {
      return originalUrl;
    }
    const suffix = pathname.slice(basePath.length);
    const rewrittenPath =
      suffix.length === 0 || suffix === '/' ? '/local-test' : `/local-test${suffix}`;
    return query ? `${rewrittenPath}?${query}` : rewrittenPath;
  };

  return createProxyMiddleware({
    target: `http://127.0.0.1:${targetPort}`,
    changeOrigin: true,
    logLevel: 'warn',
    pathRewrite: (pathReq, req) => {
      const originalUrl = typeof req.originalUrl === 'string' ? req.originalUrl : pathReq;
      return rewriteToLocalTest(originalUrl);
    },
    onError: (err, _req, res) => {
      console.error(`[gateway] Proxy error for ${serviceLabel}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: `Unable to reach ${serviceLabel} developer UI` });
      }
    }
  });
};

const buildDirectProxy = (targetPort, serviceLabel) =>
  createProxyMiddleware({
    target: `http://127.0.0.1:${targetPort}`,
    changeOrigin: true,
    logLevel: 'warn',
    onError: (err, _req, res) => {
      console.error(`[gateway] Proxy error for ${serviceLabel}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: `Unable to reach ${serviceLabel}` });
      }
    }
  });

if (enableDevUi) {
  app.use('/search/dev', buildProxy('/search/dev', searchPort, 'search service'));
  app.use('/chat/dev', buildProxy('/chat/dev', chatPort, 'chat service'));

  const searchApiProxy = buildDirectProxy(searchPort, 'search service');
  app.use('/search', (req, res, next) => {
    const originalUrl = typeof req.originalUrl === 'string' ? req.originalUrl : req.url;
    if (originalUrl.startsWith('/search/dev')) {
      next();
      return;
    }
    // Express trims the mount path from req.url, so restore the original path for the proxied request.
    req.url = originalUrl;
    searchApiProxy(req, res, next);
  });

  const chatApiProxy = buildDirectProxy(chatPort, 'chat service');
  app.use('/chat', (req, res, next) => {
    const originalUrl = typeof req.originalUrl === 'string' ? req.originalUrl : req.url;
    if (originalUrl.startsWith('/chat/dev')) {
      next();
      return;
    }
    req.url = originalUrl;
    chatApiProxy(req, res, next);
  });
} else {
  const devDisabledHandler = (_req, res) => {
    res.status(404).json({ error: 'Developer UI disabled in production' });
  };
  app.use('/search/dev', devDisabledHandler);
  app.use('/chat/dev', devDisabledHandler);
}

app.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    mode: nodeEnv,
    devUiEnabled: enableDevUi,
    searchPort,
    chatPort
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(gatewayPort, '0.0.0.0', (error) => {
  if (error) {
    console.error('[gateway] Failed to start server', error);
    process.exit(1);
  }
  logStartup();
});
