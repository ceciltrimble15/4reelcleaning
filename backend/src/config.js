// Centralized configuration + provider readiness checks.
// No secrets are ever hard-coded — everything comes from environment variables.
// If a provider's credentials are missing, the system runs that provider in
// "simulated" mode (logged as such) instead of crashing. This keeps the intake
// engine resilient and lets the full flow + tests run without live credentials.

const env = process.env;

function flag(name, fallback = false) {
  const v = env[name];
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

export const config = {
  // Global switch. When true, no real outbound calls are made (used in tests
  // and safe local runs). Also implicitly true for any provider missing creds.
  dryRun: flag('AUTOMATION_DRY_RUN', false),

  port: parseInt(env.PORT || '3000', 10),

  airtable: {
    apiKey: env.AIRTABLE_API_KEY || '',
    baseId: env.AIRTABLE_BASE_ID || '',
    contactsTable: env.AIRTABLE_CONTACTS_TABLE || 'A1_SUPPLIERS_CONTACTS',
    automationLogTable: env.AIRTABLE_AUTOMATION_LOG_TABLE || 'Automation_Log',
  },

  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID || '',
    authToken: env.TWILIO_AUTH_TOKEN || '',
    fromNumber: env.TWILIO_PHONE_NUMBER || '',
  },

  email: {
    // Provider is auto-detected: Resend uses EMAIL_PROVIDER_API_KEY (re_...).
    provider: env.EMAIL_PROVIDER || 'resend',
    apiKey: env.EMAIL_PROVIDER_API_KEY || '',
    fromAddress: env.EMAIL_FROM_ADDRESS || 'YEP <noreply@a1suppliers.org>',
  },

  internalAlertEmail: env.INTERNAL_ALERT_EMAIL || 'info@a1suppliers.org',
};

export const providerReady = {
  airtable: Boolean(config.airtable.apiKey && config.airtable.baseId),
  twilio: Boolean(
    config.twilio.accountSid && config.twilio.authToken && config.twilio.fromNumber,
  ),
  email: Boolean(config.email.apiKey),
};

// A provider runs "for real" only when global dryRun is off AND it has creds.
export function isLive(provider) {
  return !config.dryRun && providerReady[provider];
}
