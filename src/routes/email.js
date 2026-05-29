'use strict';

/**
 * POST /api/email/send
 * Direct email send endpoint. Validates, sends via Email service, logs the
 * action into Message_Log, returns success/failure.
 */

const config = require('../config');
const validation = require('../services/validation');
const email = require('../services/email');
const messageLog = require('../services/messageLog');

async function sendEmail(req, res) {
  const payload = req.body || {};
  const { valid, errors } = validation.validEmail(payload);
  if (!valid) {
    return res.json(400, { ok: false, error: 'Validation failed', details: errors });
  }

  const sent = await email.sendEmail({
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    from: payload.from,
  });

  await messageLog.log({
    action: 'email',
    status: sent.ok ? 'success' : 'failure',
    channel: 'email',
    recipient: payload.to,
    detail: sent.ok ? `messageId:${sent.messageId}` : (sent.error || 'email_failed'),
  });

  return res.json(sent.ok ? 200 : 502, {
    ok: sent.ok,
    dryRun: sent.dryRun ?? config.dryRun,
    messageId: sent.messageId,
    error: sent.error,
  });
}

module.exports = { sendEmail };
