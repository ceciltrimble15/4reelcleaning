'use strict';

/**
 * Validation service.
 *
 * Validates an intake payload and resolves the submission's form type to the
 * matching Airtable table key. Pure functions, no side effects.
 */

// Map every accepted form-type alias to a canonical table key (see config.airtable.tables).
const FORM_TYPE_ALIASES = {
  contact: 'contacts',
  contacts: 'contacts',
  general: 'contacts',
  a1_suppliers_contacts: 'contacts',

  youth: 'youth',
  youth_intake: 'youth',

  parent: 'parent_guardian',
  guardian: 'parent_guardian',
  parent_guardian: 'parent_guardian',
  parent_guardian_intake: 'parent_guardian',

  mentor: 'mentor',
  mentor_intake: 'mentor',

  volunteer: 'volunteer',
  volunteer_intake: 'volunteer',

  partner: 'partner_donor',
  donor: 'partner_donor',
  partner_donor: 'partner_donor',
  partner_donor_intake: 'partner_donor',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts +, spaces, dashes, parentheses; requires at least 7 digits.
const PHONE_DIGITS_RE = /\d/g;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function resolveFormType(rawType) {
  if (!isNonEmptyString(rawType)) return null;
  const key = rawType.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return FORM_TYPE_ALIASES[key] || null;
}

function validIntake(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['Request body must be a JSON object.'], formTypeKey: null };
  }

  const formTypeKey = resolveFormType(payload.formType || payload.form_type || payload.type);
  if (!formTypeKey) {
    errors.push(
      'Missing or unknown "formType". Expected one of: contact, youth, parent_guardian, mentor, volunteer, partner_donor.'
    );
  }

  if (!isNonEmptyString(payload.name) && !isNonEmptyString(payload.fullName)) {
    errors.push('Field "name" is required.');
  }

  const email = payload.email;
  const phone = payload.phone || payload.phoneNumber;

  // Need at least one contact channel.
  if (!isNonEmptyString(email) && !isNonEmptyString(phone)) {
    errors.push('At least one of "email" or "phone" is required.');
  }

  if (isNonEmptyString(email) && !EMAIL_RE.test(email.trim())) {
    errors.push('Field "email" is not a valid email address.');
  }

  if (isNonEmptyString(phone)) {
    const digits = (phone.match(PHONE_DIGITS_RE) || []).length;
    if (digits < 7) errors.push('Field "phone" does not contain enough digits.');
  }

  return { valid: errors.length === 0, errors, formTypeKey };
}

function validSms(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }
  if (!isNonEmptyString(payload.to)) errors.push('Field "to" is required.');
  else {
    const digits = (payload.to.match(PHONE_DIGITS_RE) || []).length;
    if (digits < 7) errors.push('Field "to" does not contain enough digits.');
  }
  if (!isNonEmptyString(payload.body) && !isNonEmptyString(payload.message)) {
    errors.push('Field "body" (message text) is required.');
  }
  return { valid: errors.length === 0, errors };
}

function validEmail(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }
  if (!isNonEmptyString(payload.to)) errors.push('Field "to" is required.');
  else if (!EMAIL_RE.test(payload.to.trim())) errors.push('Field "to" is not a valid email address.');
  if (!isNonEmptyString(payload.subject)) errors.push('Field "subject" is required.');
  if (!isNonEmptyString(payload.text) && !isNonEmptyString(payload.html)) {
    errors.push('One of "text" or "html" body is required.');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  FORM_TYPE_ALIASES,
  resolveFormType,
  validIntake,
  validSms,
  validEmail,
  isNonEmptyString,
};
