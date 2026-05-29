'use strict';

const config = require('../config');

const startedAt = Date.now();

/**
 * GET /api/health
 * Reports liveness, dry-run posture, and per-vendor readiness (without leaking
 * any secret values).
 */
async function health(_req, res) {
  res.json(200, {
    status: 'ok',
    service: 'a1-suppliers-automation-engine',
    version: require('../../package.json').version,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    dryRun: config.dryRun,
    vendors: {
      airtable: { ready: config.ready.airtable, live: config.isLive('airtable') },
      twilio: { ready: config.ready.twilio, live: config.isLive('twilio') },
      email: { ready: config.ready.email, live: config.isLive('email') },
    },
    corsAllowedOrigins: config.corsAllowedOrigins,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { health };
