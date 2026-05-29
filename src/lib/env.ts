// Centralized, type-safe access to environment variables.
//
// NOTE: No secrets or real keys live in the codebase. Values are supplied at
// runtime via environment variables (see .env.example). These helpers only
// READ from process.env and report whether a given integration is configured;
// they never hard-code credentials.

export const env = {
  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY,
    baseId: process.env.AIRTABLE_BASE_ID,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  email: {
    provider: process.env.EMAIL_PROVIDER,
    from: process.env.EMAIL_FROM,
  },
};

export function isAirtableConfigured(): boolean {
  return Boolean(env.airtable.apiKey && env.airtable.baseId);
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    env.twilio.accountSid && env.twilio.authToken && env.twilio.phoneNumber,
  );
}

export function isEmailConfigured(): boolean {
  return Boolean(env.email.provider && env.email.from);
}
