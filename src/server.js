'use strict';

/**
 * A1 Suppliers Automation Engine — HTTP server.
 *
 * Zero runtime dependencies: built on Node's native `http` module so the
 * engine runs in dry-run mode without any npm install. Vendor SDKs are lazily
 * required only when real credentials are configured.
 *
 * Responsibilities:
 *   - CORS allowlist (only the two approved origins).
 *   - JSON body parsing with a size guard.
 *   - Routing to the intake / sms / email / health handlers.
 */

const http = require('http');
const { URL } = require('url');

const config = require('./config');
const logger = require('./logger');

const intakeRoute = require('./routes/intake');
const smsRoute = require('./routes/sms');
const emailRoute = require('./routes/email');
const healthRoute = require('./routes/health');

const MAX_BODY_BYTES = 1024 * 256; // 256 KB

// Route table: "METHOD PATH" -> handler(req, res)
const routes = {
  'POST /api/intake': intakeRoute.intake,
  'POST /api/sms/send': smsRoute.sendSms,
  'POST /api/email/send': emailRoute.sendEmail,
  'GET /api/health': healthRoute.health,
};

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowed = origin && config.corsAllowedOrigins.includes(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  return { origin, allowed };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_e) {
        reject(Object.assign(new Error('Invalid JSON body'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function makeRes(httpRes) {
  return {
    json(statusCode, obj) {
      const data = JSON.stringify(obj);
      httpRes.writeHead(statusCode, { 'Content-Type': 'application/json' });
      httpRes.end(data);
    },
  };
}

async function handler(httpReq, httpRes) {
  const startedAt = Date.now();
  const { allowed: corsAllowed } = applyCors(httpReq, httpRes);
  const res = makeRes(httpRes);

  let pathname = '/';
  try {
    pathname = new URL(httpReq.url, `http://${httpReq.headers.host || 'localhost'}`).pathname;
  } catch (_e) {
    /* fall through with default */
  }

  // Preflight.
  if (httpReq.method === 'OPTIONS') {
    httpRes.writeHead(corsAllowed ? 204 : 403);
    httpRes.end();
    return;
  }

  const key = `${httpReq.method} ${pathname}`;
  const route = routes[key];

  // Enforce CORS allowlist for cross-origin browser requests. Requests without
  // an Origin header (server-to-server, curl) are permitted.
  const origin = httpReq.headers.origin;
  if (origin && !corsAllowed) {
    logger.warn('cors.blocked', { origin, path: pathname });
    return res.json(403, { ok: false, error: 'Origin not allowed by CORS policy.' });
  }

  if (!route) {
    return res.json(404, { ok: false, error: `Not found: ${key}` });
  }

  try {
    let body = {};
    if (httpReq.method === 'POST') body = await readJsonBody(httpReq);
    const req = { method: httpReq.method, path: pathname, headers: httpReq.headers, body };
    await route(req, res);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    logger.error('request.error', { path: pathname, error: err.message, statusCode });
    if (!httpRes.headersSent) res.json(statusCode, { ok: false, error: err.message });
  } finally {
    logger.info('request', {
      method: httpReq.method,
      path: pathname,
      status: httpRes.statusCode,
      ms: Date.now() - startedAt,
    });
  }
}

function createServer() {
  return http.createServer(handler);
}

// Start only when run directly (not when required by tests).
if (require.main === module) {
  const server = createServer();
  server.listen(config.port, () => {
    logger.info('server.started', {
      port: config.port,
      dryRun: config.dryRun,
      vendors: {
        airtable: config.isLive('airtable'),
        twilio: config.isLive('twilio'),
        email: config.isLive('email'),
      },
      corsAllowedOrigins: config.corsAllowedOrigins,
    });
  });
}

module.exports = { createServer, handler, routes };
