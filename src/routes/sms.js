'use strict';

/**
 * POST /api/sms/send
 * Direct SMS send endpoint. Validates, sends via Twilio service, logs the
 * action into Message_Log, returns success/failure.
 */

const config = require('../config');
const validation = require('../services/validation');
const twilio = require('../services/twilio');
const messageLog = require('../services/messageLog');

async function sendSms(req, res) {
  const payload = req.body || {};
  const { valid, errors } = validation.validSms(payload);
  if (!valid) {
    return res.json(400, { ok: false, error: 'Validation failed', details: errors });
  }

  const body = payload.body || payload.message;
  const sms = await twilio.sendSms({ to: payload.to, body, from: payload.from });

  await messageLog.log({
    action: 'sms',
    status: sms.ok ? 'success' : 'failure',
    channel: 'twilio',
    recipient: payload.to,
    detail: sms.ok ? `sid:${sms.sid}` : (sms.error || 'sms_failed'),
  });

  return res.json(sms.ok ? 200 : 502, {
    ok: sms.ok,
    dryRun: sms.dryRun ?? config.dryRun,
    sid: sms.sid,
    error: sms.error,
  });
}

module.exports = { sendSms };
