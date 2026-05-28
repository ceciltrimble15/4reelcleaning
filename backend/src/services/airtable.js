// Airtable service for the A1_SUPPLIERS_CONTACTS master CRM + Automation_Log.
// REST API via fetch (no SDK). Credentials stay server-side only.
//
// When Airtable is not live (dry-run or missing creds) an in-memory store backs
// these functions so the full intake flow + duplicate protection still run and
// can be tested without live credentials.

import { config, isLive } from '../config.js';
import { classifyContact } from './classify.js';

const API_ROOT = 'https://api.airtable.com/v0';

// ---- In-memory fallback store (dry-run / no creds) --------------------------
const memory = {
  contacts: new Map(), // id -> fields
  logs: [],
  seq: 0,
};
const newId = (prefix) => `${prefix}_${Date.now()}_${++memory.seq}`;

// ---- Field mapping ----------------------------------------------------------
// Internal contact object -> Airtable column names (the documented schema).
export function toAirtableFields(contact) {
  const fields = {
    'Full Name': contact.fullName,
    Email: contact.email,
    Phone: contact.phone,
    Category: contact.category,
    Age: contact.age,
    'Age Group': contact.ageGroup,
    'Parent/Guardian Name': contact.parentName,
    'Parent/Guardian Email': contact.parentEmail,
    'Parent/Guardian Phone': contact.parentPhone,
    'Interest Area': contact.interestArea,
    Source: contact.source,
    Message: contact.message,
    Consent: contact.consent,
    Status: contact.status,
    Tags: contact.tags,
    'Welcome Email Sent': contact.welcomeEmailSent,
    'SMS Sent': contact.smsSent,
    'Internal Alert Sent': contact.internalAlertSent,
    'Follow-Up Stage': contact.followUpStage,
    'Next Follow-Up Date': contact.nextFollowUpDate,
    'Last Contacted': contact.lastContacted,
    'Automation Notes': contact.automationNotes,
  };
  // Drop undefined so we never overwrite existing values with blanks.
  Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
  return fields;
}

// ---- REST helpers -----------------------------------------------------------
async function airtableRequest(method, path, body) {
  const url = `${API_ROOT}/${config.airtable.baseId}/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.airtable.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Airtable ${res.status}: ${JSON.stringify(data.error || data)}`);
  }
  return data;
}

const enc = (s) => encodeURIComponent(s);
// Escape single quotes for Airtable formula string literals.
const q = (v) => `'${String(v).replace(/'/g, "\\'")}'`;

// ---- classifyContact() ------------------------------------------------------
// Re-exported here so the Airtable service exposes the full documented surface.
export { classifyContact };

// ---- findDuplicateByEmailOrPhone() -----------------------------------------
// Returns { id, fields } of an existing contact, or null.
export async function findDuplicateByEmailOrPhone(email, phone) {
  if (!email && !phone) return null;

  if (!isLive('airtable')) {
    for (const [id, fields] of memory.contacts) {
      if (
        (email && fields.Email && fields.Email.toLowerCase() === email.toLowerCase()) ||
        (phone && fields.Phone && fields.Phone === phone)
      ) {
        return { id, fields };
      }
    }
    return null;
  }

  const clauses = [];
  if (email) clauses.push(`LOWER({Email})=LOWER(${q(email)})`);
  if (phone) clauses.push(`{Phone}=${q(phone)}`);
  const formula = clauses.length > 1 ? `OR(${clauses.join(',')})` : clauses[0];
  const path = `${enc(config.airtable.contactsTable)}?maxRecords=1&filterByFormula=${enc(formula)}`;
  const data = await airtableRequest('GET', path);
  const rec = data.records && data.records[0];
  return rec ? { id: rec.id, fields: rec.fields } : null;
}

// ---- createContact() --------------------------------------------------------
export async function createContact(contact) {
  const fields = toAirtableFields(contact);
  if (!isLive('airtable')) {
    const id = newId('rec');
    memory.contacts.set(id, { ...fields });
    return { id, fields };
  }
  const data = await airtableRequest('POST', enc(config.airtable.contactsTable), {
    fields,
    typecast: true,
  });
  return { id: data.id, fields: data.fields };
}

// ---- updateContact() --------------------------------------------------------
// Patch only the provided fields — never overwrites untouched columns, never
// deletes the original intake record.
export async function updateContact(id, partialContact) {
  const fields = toAirtableFields(partialContact);
  if (!isLive('airtable')) {
    const existing = memory.contacts.get(id) || {};
    const merged = { ...existing, ...fields };
    memory.contacts.set(id, merged);
    return { id, fields: merged };
  }
  const data = await airtableRequest(
    'PATCH',
    `${enc(config.airtable.contactsTable)}/${id}`,
    { fields, typecast: true },
  );
  return { id: data.id, fields: data.fields };
}

// ---- updateStatus() ---------------------------------------------------------
export function updateStatus(id, status) {
  return updateContact(id, { status });
}

// ---- updateFollowUp() -------------------------------------------------------
export function updateFollowUp(id, { stage, nextFollowUpDate, lastContacted } = {}) {
  return updateContact(id, {
    followUpStage: stage,
    nextFollowUpDate,
    lastContacted,
  });
}

// ---- logAutomationAction() --------------------------------------------------
// Writes one row to Automation_Log. Never throws — logging must not break the
// intake flow.
export async function logAutomationAction(entry) {
  const fields = {
    'Contact ID': entry.contactId,
    Category: entry.category,
    'Action Type': entry.actionType,
    Provider: entry.provider,
    Status: entry.status,
    Timestamp: entry.timestamp || new Date().toISOString(),
    'Provider Response':
      typeof entry.providerResponse === 'string'
        ? entry.providerResponse
        : JSON.stringify(entry.providerResponse || ''),
    'Error Message': entry.errorMessage || '',
  };

  if (!isLive('airtable')) {
    memory.logs.push(fields);
    return { id: newId('log'), fields };
  }
  try {
    const data = await airtableRequest('POST', enc(config.airtable.automationLogTable), {
      fields,
      typecast: true,
    });
    return { id: data.id, fields: data.fields };
  } catch (err) {
    // Last-resort: surface to stderr so the action is never silently lost.
    console.error('[Automation_Log] failed to write:', err.message, fields);
    return { id: null, fields, error: err.message };
  }
}

// Exposed for tests/inspection in dry-run mode.
export const _memory = memory;
