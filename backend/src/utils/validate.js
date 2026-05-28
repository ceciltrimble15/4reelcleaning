// Input validation + sanitization helpers.
// Security rule: validate email, validate phone, sanitize free text,
// never trust client-submitted data.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v.length <= 254 && EMAIL_RE.test(v);
}

// Normalize a phone number to E.164-ish form. Accepts common US formats and
// returns null when it cannot produce something Twilio-deliverable.
export function normalizePhone(value, defaultCountry = '1') {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const hadPlus = raw.startsWith('+');
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;

  if (hadPlus) {
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }
  // Bare 10-digit US number.
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  // 11-digit starting with country code 1.
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Otherwise accept plausible international length, assume already includes CC.
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function isValidPhone(value) {
  return normalizePhone(value) !== null;
}

// Strip control characters and trim. Caps length to protect downstream systems.
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeText(value, maxLen = 2000) {
  if (value === undefined || value === null) return '';
  return String(value).replace(CONTROL_CHARS_RE, '').trim().slice(0, maxLen);
}

export function sanitizeName(value) {
  return sanitizeText(value, 120);
}

// Coerce a consent-ish value into a boolean.
export function parseConsent(value) {
  if (value === true) return true;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on', 'agree', 'agreed', 'consent'].includes(
      value.trim().toLowerCase(),
    );
  }
  return false;
}
