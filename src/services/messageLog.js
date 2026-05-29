'use strict';

/**
 * Message Log service.
 *
 * Writes a structured audit row into the Airtable Message_Log table for every
 * meaningful action (intake received, SMS sent, email sent, errors). Always
 * emits a structured log line too, so the audit trail exists even in dry-run.
 */

const airtable = require('./airtable');
const logger = require('../logger');

/**
 * @param {object} entry
 * @param {string} entry.action       - e.g. "intake", "sms", "email"
 * @param {string} entry.status       - "success" | "failure" | "partial"
 * @param {string} [entry.channel]    - "airtable" | "twilio" | "email" | "system"
 * @param {string} [entry.formType]   - canonical form type key
 * @param {string} [entry.recipient]  - phone/email/destination
 * @param {string} [entry.detail]     - human-readable detail
 * @param {object} [entry.meta]       - extra structured fields
 * @returns {Promise<{ok: boolean, dryRun: boolean, id: string|null}>}
 */
async function log(entry) {
  const fields = {
    Action: entry.action || 'unknown',
    Status: entry.status || 'unknown',
    Channel: entry.channel || 'system',
    Form_Type: entry.formType || '',
    Recipient: entry.recipient || '',
    Detail: entry.detail || '',
    Meta: entry.meta ? JSON.stringify(entry.meta) : '',
    Timestamp: new Date().toISOString(),
  };

  // Always emit a structured app log line.
  logger.info('message_log', fields);

  // Persist to the Message_Log table (dry-run aware inside airtable service).
  const res = await airtable.createRecord('message_log', fields);
  return { ok: res.ok, dryRun: res.dryRun, id: res.id };
}

module.exports = { log };
