// Standalone HTTP server for the A/1 Suppliers intake engine.
// Zero runtime dependencies — uses Node's built-in http module.
// Exposes:  POST /api/intake-webhook   and   GET /health
//
// The same core logic is reused by the serverless wrapper in /api.

import http from 'node:http';
import { config } from './config.js';
import { handleIntake } from './handler.js';

const MAX_BODY_BYTES = 256 * 1024; // guard against oversized payloads

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'));
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
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, { ok: true, service: 'a1-suppliers-intake', time: new Date().toISOString() });
  }

  if (req.method === 'POST' && url.pathname === '/api/intake-webhook') {
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      return send(res, 400, { ok: false, error: err.message });
    }
    try {
      const result = await handleIntake(payload);
      return send(res, result.status, result.body);
    } catch (err) {
      // Never leak internals to the client.
      console.error('[intake-webhook] unhandled error:', err);
      return send(res, 500, { ok: false, error: 'Internal error' });
    }
  }

  return send(res, 404, { ok: false, error: 'Not found' });
});

// Only listen when run directly (not when imported by tests).
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  server.listen(config.port, () => {
    console.log(`A/1 Suppliers intake engine listening on :${config.port}`);
    console.log(`  POST http://localhost:${config.port}/api/intake-webhook`);
    if (config.dryRun) console.log('  (AUTOMATION_DRY_RUN is ON — no real messages will be sent)');
  });
}
