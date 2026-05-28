// Core intake handler — framework-agnostic.
// Implements the PRIMARY WORKFLOW:
//   intake -> create/update contact -> classify -> welcome email -> SMS
//   -> internal alert -> update status/flags -> log every action.
//
// Returns { status, body }. Used by both the standalone HTTP server and the
// serverless (Vercel-style) wrapper.

import { CONTACT_TYPES, classifyContact, ageGroupFor } from './services/classify.js';
import * as airtable from './services/airtable.js';
import { sendWelcomeEmail, sendInternalAlert } from './services/email.js';
import { sendWelcomeSMS } from './services/twilio.js';
import {
  isValidEmail,
  normalizePhone,
  sanitizeText,
  sanitizeName,
  parseConsent,
} from './utils/validate.js';

// Map a raw, untrusted submission to a clean internal contact object.
// Validates email/phone and sanitizes every free-text field.
export function normalizeIntake(raw = {}) {
  const errors = [];

  const fullName = sanitizeName(raw.fullName || raw.name || raw.full_name);
  if (!fullName) errors.push('Full Name is required.');

  let email = sanitizeText(raw.email, 254).toLowerCase();
  if (email && !isValidEmail(email)) {
    errors.push('Email is not valid.');
    email = '';
  }

  const phone = normalizePhone(raw.phone || raw.phoneNumber || raw.mobile);
  if ((raw.phone || raw.phoneNumber || raw.mobile) && !phone) {
    errors.push('Phone number is not valid.');
  }

  const parentEmailRaw = sanitizeText(raw.parentEmail || raw.parent_email, 254).toLowerCase();
  const parentEmail = parentEmailRaw && isValidEmail(parentEmailRaw) ? parentEmailRaw : '';
  const parentPhone = normalizePhone(raw.parentPhone || raw.parent_phone);

  const ageNum = Number.parseInt(raw.age, 10);
  const age = Number.isNaN(ageNum) ? undefined : ageNum;

  const contact = {
    fullName,
    email,
    phone: phone || '',
    age,
    ageGroup: raw.ageGroup ? sanitizeText(raw.ageGroup, 40) : ageGroupFor(age),
    parentName: sanitizeName(raw.parentName || raw.parent_name),
    parentEmail,
    parentPhone: parentPhone || '',
    interestArea: sanitizeText(raw.interestArea || raw.interest, 200),
    source: sanitizeText(raw.source, 120) || 'website',
    message: sanitizeText(raw.message, 2000),
    consent: parseConsent(raw.consent),
    tags: sanitizeText(raw.tags, 200),
  };

  // Classification depends on the (sanitized) inputs.
  contact.category = classifyContact({
    category: raw.category,
    role: raw.role,
    interest: raw.interest || raw.interestArea,
    age,
  });

  // At least one usable channel must exist (own or, for minors, parent's).
  const hasChannel =
    contact.email || contact.phone || contact.parentEmail || contact.parentPhone;
  if (!hasChannel) errors.push('At least one of email or phone is required.');

  return { contact, errors };
}

// Decide which address/number a welcome should be delivered to. For Youth with
// no direct channel, fall back to the parent/guardian's contact info.
function deliveryTargets(contact) {
  if (contact.category === CONTACT_TYPES.YOUTH) {
    return {
      email: contact.email || contact.parentEmail || '',
      phone: contact.phone || contact.parentPhone || '',
    };
  }
  return { email: contact.email, phone: contact.phone };
}

export async function handleIntake(raw) {
  const { contact, errors } = normalizeIntake(raw);
  if (errors.length) {
    return { status: 400, body: { ok: false, errors } };
  }

  const actions = [];
  const log = async (entry) => {
    const result = await airtable.logAutomationAction({
      contactId: entry.contactId,
      category: contact.category,
      ...entry,
    });
    actions.push({
      actionType: entry.actionType,
      provider: entry.provider,
      status: entry.status,
      error: entry.errorMessage,
    });
    return result;
  };

  // 1) Find existing contact (duplicate protection starts here).
  let existing = null;
  try {
    existing = await airtable.findDuplicateByEmailOrPhone(contact.email, contact.phone);
  } catch (err) {
    await log({ actionType: 'lookup', provider: 'airtable', status: 'error', errorMessage: err.message });
  }

  // 2) Create or update the contact record. We never overwrite original intake
  //    fields on an existing record — we only set status/automation metadata
  //    and fill blanks.
  let contactId;
  let alreadyEmailed = false;
  let alreadyTexted = false;
  let alreadyAlerted = false;

  try {
    if (existing) {
      contactId = existing.id;
      const f = existing.fields || {};
      alreadyEmailed = Boolean(f['Welcome Email Sent']);
      alreadyTexted = Boolean(f['SMS Sent']);
      alreadyAlerted = Boolean(f['Internal Alert Sent']);
      await airtable.updateContact(contactId, {
        status: f.Status || 'Re-engaged',
        lastContacted: new Date().toISOString(),
        automationNotes: `Duplicate intake received ${new Date().toISOString()} from ${contact.source}.`,
      });
      await log({ contactId, actionType: 'update-contact', provider: 'airtable', status: 'duplicate' });
    } else {
      const created = await airtable.createContact({
        ...contact,
        status: 'New',
        followUpStage: 'Stage 1 - Welcome',
        welcomeEmailSent: false,
        smsSent: false,
        internalAlertSent: false,
      });
      contactId = created.id;
      await log({ contactId, actionType: 'create-contact', provider: 'airtable', status: 'created' });
    }
  } catch (err) {
    await log({ contactId, actionType: 'create-contact', provider: 'airtable', status: 'error', errorMessage: err.message });
    return { status: 502, body: { ok: false, error: 'CRM write failed', detail: err.message } };
  }

  const targets = deliveryTargets(contact);

  // 3) Welcome email — skip if already sent (duplicate protection).
  if (alreadyEmailed) {
    await log({ contactId, actionType: 'welcome-email', provider: 'email', status: 'skipped-duplicate' });
  } else if (!targets.email) {
    await log({ contactId, actionType: 'welcome-email', provider: 'email', status: 'skipped-no-address' });
  } else {
    const r = await sendWelcomeEmail(contact.category, { ...contact, email: targets.email });
    await log({ contactId, actionType: 'welcome-email', provider: r.provider, status: r.status, providerResponse: r.response, errorMessage: r.error });
    if (r.status === 'sent' || r.status === 'simulated') {
      await airtable.updateContact(contactId, { welcomeEmailSent: true });
    }
  }

  // 4) Welcome SMS — skip if already sent (duplicate protection).
  if (alreadyTexted) {
    await log({ contactId, actionType: 'welcome-sms', provider: 'twilio', status: 'skipped-duplicate' });
  } else if (!targets.phone) {
    await log({ contactId, actionType: 'welcome-sms', provider: 'twilio', status: 'skipped-no-phone' });
  } else {
    const r = await sendWelcomeSMS(contact.category, contact, targets.phone);
    await log({ contactId, actionType: 'welcome-sms', provider: 'twilio', status: r.status, providerResponse: r.response, errorMessage: r.error });
    if (r.status === 'sent' || r.status === 'simulated') {
      await airtable.updateContact(contactId, { smsSent: true });
    }
  }

  // 5) Internal alert to info@a1suppliers.org — once per contact.
  if (alreadyAlerted) {
    await log({ contactId, actionType: 'internal-alert', provider: 'email', status: 'skipped-duplicate' });
  } else {
    const r = await sendInternalAlert({ ...contact, contactId });
    await log({ contactId, actionType: 'internal-alert', provider: r.provider, status: r.status, providerResponse: r.response, errorMessage: r.error });
    if (r.status === 'sent' || r.status === 'simulated') {
      await airtable.updateContact(contactId, { internalAlertSent: true });
    }
  }

  // 6) Advance status + follow-up stage for brand-new contacts.
  if (!existing) {
    const next = new Date();
    next.setDate(next.getDate() + 3); // first follow-up in 3 days
    await airtable.updateStatus(contactId, 'Contacted');
    await airtable.updateFollowUp(contactId, {
      stage: 'Stage 2 - Follow-Up Pending',
      nextFollowUpDate: next.toISOString().slice(0, 10),
      lastContacted: new Date().toISOString(),
    });
    await log({ contactId, actionType: 'status-update', provider: 'airtable', status: 'contacted' });
  }

  return {
    status: 200,
    body: {
      ok: true,
      contactId,
      category: contact.category,
      duplicate: Boolean(existing),
      actions,
    },
  };
}
