'use strict';

/**
 * Email service.
 *
 * Sends email via SMTP (nodemailer). In dry-run mode it logs the intended
 * message and returns a simulated message id without any network call. The
 * `nodemailer` dependency is lazily required only when live.
 */

const config = require('../config');
const logger = require('../logger');

let _transport = null;
function getTransport() {
  if (_transport) return _transport;
  const nodemailer = require('nodemailer');
  _transport = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  return _transport;
}

/**
 * Send an email.
 * @param {{to: string, subject: string, text?: string, html?: string, from?: string}} opts
 * @returns {Promise<{ok: boolean, dryRun: boolean, messageId: string|null, error?: string}>}
 */
async function sendEmail({ to, subject, text, html, from }) {
  const fromAddr = from || config.email.from;

  if (!config.isLive('email')) {
    const simulatedId = 'msgDRYRUN' + Math.random().toString(36).slice(2, 14) + '@dry-run.local';
    logger.info('email.sendEmail (dry-run)', { to, from: fromAddr, subject, text, html, simulatedId });
    return { ok: true, dryRun: true, messageId: simulatedId };
  }

  try {
    const info = await getTransport().sendMail({ from: fromAddr, to, subject, text, html });
    logger.info('email.sendEmail (live)', { to, from: fromAddr, subject, messageId: info.messageId });
    return { ok: true, dryRun: false, messageId: info.messageId };
  } catch (err) {
    logger.error('email.sendEmail failed', { to, subject, error: err.message });
    return { ok: false, dryRun: false, messageId: null, error: err.message };
  }
}

module.exports = { sendEmail };
