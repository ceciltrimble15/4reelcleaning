'use strict';

/**
 * Twilio SMS service.
 *
 * Sends SMS via Twilio. In dry-run mode it logs the intended message and
 * returns a simulated SID without any network call. The `twilio` SDK is lazily
 * required only when live.
 */

const config = require('../config');
const logger = require('../logger');

let _client = null;
function getClient() {
  if (_client) return _client;
  const twilio = require('twilio');
  _client = twilio(config.twilio.accountSid, config.twilio.authToken);
  return _client;
}

/**
 * Send an SMS.
 * @param {{to: string, body: string, from?: string}} opts
 * @returns {Promise<{ok: boolean, dryRun: boolean, sid: string|null, error?: string}>}
 */
async function sendSms({ to, body, from }) {
  const fromNumber = from || config.twilio.fromNumber;

  if (!config.isLive('twilio')) {
    const simulatedSid = 'SMDRYRUN' + Math.random().toString(36).slice(2, 14);
    logger.info('twilio.sendSms (dry-run)', { to, from: fromNumber, body, simulatedSid });
    return { ok: true, dryRun: true, sid: simulatedSid };
  }

  try {
    const msg = await getClient().messages.create({ to, from: fromNumber, body });
    logger.info('twilio.sendSms (live)', { to, from: fromNumber, sid: msg.sid });
    return { ok: true, dryRun: false, sid: msg.sid };
  } catch (err) {
    logger.error('twilio.sendSms failed', { to, error: err.message });
    return { ok: false, dryRun: false, sid: null, error: err.message };
  }
}

module.exports = { sendSms };
