// Twilio SMS service (REST API via fetch + Basic Auth, no SDK needed).
// Credentials stay server-side only. Per-category helpers build the right
// message from the SMS templates and dispatch through one core sender.

import { config, isLive } from '../config.js';
import { CONTACT_TYPES } from './classify.js';
import { SMS_TEMPLATES } from '../templates/sms.js';

// Core sender. Never throws to the caller — returns a normalized result.
async function sendSMS(to, body) {
  if (!to) {
    return { status: 'skipped', provider: 'twilio', response: 'no destination number' };
  }
  if (!isLive('twilio')) {
    return {
      status: 'simulated',
      provider: 'twilio',
      response: `DRY-RUN sms -> ${to} | ${body}`,
    };
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`;
    const auth = Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString(
      'base64',
    );
    const form = new URLSearchParams({ To: to, From: config.twilio.fromNumber, Body: body });
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Twilio ${res.status}: ${data.message || JSON.stringify(data)}`);
    }
    return { status: 'sent', provider: 'twilio', response: { sid: data.sid, status: data.status } };
  } catch (err) {
    return { status: 'error', provider: 'twilio', response: null, error: err.message };
  }
}

const make = (category) => (contact, to) =>
  sendSMS(to || contact.phone, SMS_TEMPLATES[category](contact));

// Per-category senders required by the build spec.
export const sendYouthSMS = make(CONTACT_TYPES.YOUTH);
export const sendParentSMS = make(CONTACT_TYPES.PARENT);
export const sendYoungAdultSMS = make(CONTACT_TYPES.YOUNG_ADULT);
export const sendMentorSMS = make(CONTACT_TYPES.MENTOR);
export const sendVolunteerSMS = make(CONTACT_TYPES.VOLUNTEER);
export const sendSponsorSMS = make(CONTACT_TYPES.SPONSOR);
export const sendPartnerSMS = make(CONTACT_TYPES.PARTNER);
export const sendGeneralSMS = make(CONTACT_TYPES.GENERAL);

// Dispatch table so the handler can pick the right sender by category.
export const SMS_SENDERS = {
  [CONTACT_TYPES.YOUTH]: sendYouthSMS,
  [CONTACT_TYPES.PARENT]: sendParentSMS,
  [CONTACT_TYPES.YOUNG_ADULT]: sendYoungAdultSMS,
  [CONTACT_TYPES.MENTOR]: sendMentorSMS,
  [CONTACT_TYPES.VOLUNTEER]: sendVolunteerSMS,
  [CONTACT_TYPES.SPONSOR]: sendSponsorSMS,
  [CONTACT_TYPES.PARTNER]: sendPartnerSMS,
  [CONTACT_TYPES.GENERAL]: sendGeneralSMS,
};

export function sendWelcomeSMS(category, contact, to) {
  const sender = SMS_SENDERS[category] || sendGeneralSMS;
  return sender(contact, to);
}

export { sendSMS };
