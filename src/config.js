'use strict';

/**
 * Configuration loader.
 *
 * Loads environment variables (with a tiny zero-dependency .env parser so the
 * engine runs without `dotenv` installed) and derives the global DRY_RUN flag.
 *
 * DRY-RUN policy (per IMPLEMENTATION_PROMPT.md):
 *   - Defaults to ON.
 *   - Stays ON unless DRY_RUN is explicitly "false" AND the relevant vendor
 *     credentials are present. This guarantees we never call a vendor with
 *     missing keys.
 */

const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip matching surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

function bool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

const env = process.env;

const airtable = {
  apiKey: env.AIRTABLE_API_KEY || '',
  baseId: env.AIRTABLE_BASE_ID || '',
  tables: {
    contacts: env.AIRTABLE_TABLE_CONTACTS || 'A1_Suppliers_Contacts',
    youth: env.AIRTABLE_TABLE_YOUTH || 'Youth_Intake',
    parent_guardian: env.AIRTABLE_TABLE_PARENT_GUARDIAN || 'Parent_Guardian_Intake',
    mentor: env.AIRTABLE_TABLE_MENTOR || 'Mentor_Intake',
    volunteer: env.AIRTABLE_TABLE_VOLUNTEER || 'Volunteer_Intake',
    partner_donor: env.AIRTABLE_TABLE_PARTNER_DONOR || 'Partner_Donor_Intake',
    message_log: env.AIRTABLE_TABLE_MESSAGE_LOG || 'Message_Log',
  },
};

const twilio = {
  accountSid: env.TWILIO_ACCOUNT_SID || '',
  authToken: env.TWILIO_AUTH_TOKEN || '',
  fromNumber: env.TWILIO_FROM_NUMBER || '',
  notifyNumber: env.TWILIO_NOTIFY_NUMBER || '',
};

const email = {
  host: env.SMTP_HOST || '',
  port: Number(env.SMTP_PORT || 587),
  secure: bool(env.SMTP_SECURE, false),
  user: env.SMTP_USER || '',
  pass: env.SMTP_PASS || '',
  from: env.EMAIL_FROM || 'A1 Suppliers <no-reply@a1suppliers.org>',
  notifyTo: env.EMAIL_NOTIFY_TO || 'info@a1suppliers.org',
};

// Vendor readiness checks.
const ready = {
  airtable: Boolean(airtable.apiKey && airtable.baseId),
  twilio: Boolean(twilio.accountSid && twilio.authToken && twilio.fromNumber),
  email: Boolean(email.host && email.user && email.pass),
};

// Global dry-run: ON by default. Only OFF when explicitly disabled.
const globalDryRun = bool(env.DRY_RUN, true);

const config = {
  port: Number(env.PORT || 3000),
  nodeEnv: env.NODE_ENV || 'development',

  // Global flag (true = simulate everything).
  dryRun: globalDryRun,

  corsAllowedOrigins: (
    env.CORS_ALLOWED_ORIGINS ||
    'https://a1suppliers.org,https://a1-suppliers-website.vercel.app'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  airtable,
  twilio,
  email,
  ready,

  /**
   * Per-vendor effective dry-run. A vendor is live only when the global flag
   * is off AND that vendor's credentials are present.
   */
  isLive(vendor) {
    return !globalDryRun && Boolean(ready[vendor]);
  },
};

module.exports = config;
