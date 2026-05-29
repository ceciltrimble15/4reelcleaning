'use strict';

/**
 * POST /api/intake
 *
 * The existing website posts form submissions here. The handler:
 *   1. Validates the payload and resolves the target Airtable table.
 *   2. Saves the submission to Airtable.
 *   3. Sends a Twilio SMS (internal notification + optional confirmation).
 *   4. Sends an email confirmation/notification.
 *   5. Logs every action into Message_Log.
 *   6. Returns success/failure.
 *
 * Vendor failures are non-fatal: the submission still succeeds if it was saved,
 * and the partial outcome is reported per-channel.
 */

const config = require('../config');
const validation = require('../services/validation');
const airtable = require('../services/airtable');
const twilio = require('../services/twilio');
const email = require('../services/email');
const messageLog = require('../services/messageLog');

function buildAirtableFields(payload) {
  const fields = {
    Name: payload.name || payload.fullName || '',
    Email: payload.email || '',
    Phone: payload.phone || payload.phoneNumber || '',
    Message: payload.message || payload.notes || '',
    Source: payload.source || 'website',
    Submitted_At: new Date().toISOString(),
  };
  // Pass through any extra primitive fields the website includes.
  for (const [k, v] of Object.entries(payload)) {
    if (['formType', 'form_type', 'type', 'name', 'fullName', 'email', 'phone', 'phoneNumber', 'message', 'notes', 'source'].includes(k)) continue;
    if (v !== null && typeof v !== 'object') fields[k] = v;
  }
  return fields;
}

async function intake(req, res) {
  const payload = req.body || {};
  const { valid, errors, formTypeKey } = validation.validIntake(payload);

  if (!valid) {
    await messageLog.log({
      action: 'intake',
      status: 'failure',
      channel: 'system',
      detail: 'validation_failed',
      meta: { errors },
    });
    return res.json(400, { ok: false, error: 'Validation failed', details: errors });
  }

  const name = payload.name || payload.fullName;
  const recipientEmail = payload.email;
  const recipientPhone = payload.phone || payload.phoneNumber;

  const result = {
    ok: false,
    dryRun: config.dryRun,
    formType: formTypeKey,
    airtable: null,
    sms: null,
    email: null,
  };

  // 1) Save to Airtable.
  const saved = await airtable.createRecord(formTypeKey, buildAirtableFields(payload));
  result.airtable = { ok: saved.ok, id: saved.id, table: saved.table, dryRun: saved.dryRun, error: saved.error };
  await messageLog.log({
    action: 'intake',
    status: saved.ok ? 'success' : 'failure',
    channel: 'airtable',
    formType: formTypeKey,
    recipient: recipientEmail || recipientPhone || '',
    detail: saved.ok ? `record:${saved.id}` : (saved.error || 'airtable_failed'),
  });

  // 2) Twilio SMS — internal notification (and confirmation if we have a phone).
  const smsTarget = config.twilio.notifyNumber || recipientPhone;
  if (smsTarget) {
    const smsBody = `New ${formTypeKey} intake from ${name || 'unknown'}` +
      (recipientEmail ? ` (${recipientEmail})` : '') +
      (recipientPhone ? ` ${recipientPhone}` : '');
    const sms = await twilio.sendSms({ to: smsTarget, body: smsBody });
    result.sms = { ok: sms.ok, sid: sms.sid, dryRun: sms.dryRun, error: sms.error };
    await messageLog.log({
      action: 'sms',
      status: sms.ok ? 'success' : 'failure',
      channel: 'twilio',
      formType: formTypeKey,
      recipient: smsTarget,
      detail: sms.ok ? `sid:${sms.sid}` : (sms.error || 'sms_failed'),
    });
  } else {
    result.sms = { ok: true, skipped: true, reason: 'no_phone_or_notify_number' };
  }

  // 3) Email — confirmation to submitter (if email present) else internal notify.
  const emailTarget = recipientEmail || config.email.notifyTo;
  if (emailTarget) {
    const subject = `A1 Suppliers — ${formTypeKey} intake received`;
    const text = `Hi ${name || ''},\n\nThank you — we received your ${formTypeKey} submission and will be in touch shortly.\n\n— A1 Suppliers`;
    const sent = await email.sendEmail({ to: emailTarget, subject, text });
    result.email = { ok: sent.ok, messageId: sent.messageId, dryRun: sent.dryRun, error: sent.error };
    await messageLog.log({
      action: 'email',
      status: sent.ok ? 'success' : 'failure',
      channel: 'email',
      formType: formTypeKey,
      recipient: emailTarget,
      detail: sent.ok ? `messageId:${sent.messageId}` : (sent.error || 'email_failed'),
    });
  } else {
    result.email = { ok: true, skipped: true, reason: 'no_email_target' };
  }

  // Overall success requires the Airtable save to have succeeded.
  result.ok = Boolean(saved.ok);
  const statusCode = result.ok ? 200 : 502;

  await messageLog.log({
    action: 'intake',
    status: result.ok ? 'success' : 'partial',
    channel: 'system',
    formType: formTypeKey,
    recipient: recipientEmail || recipientPhone || '',
    detail: 'intake_complete',
    meta: { airtable: result.airtable?.ok, sms: result.sms?.ok, email: result.email?.ok },
  });

  return res.json(statusCode, result);
}

module.exports = { intake };
