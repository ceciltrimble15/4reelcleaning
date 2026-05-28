// SMS templates for the A/1 Suppliers intake engine.
// Kept short (single segment where possible). Slogan-aligned, never generic.

import { CONTACT_TYPES } from '../services/classify.js';

const first = (fullName) => (fullName ? String(fullName).trim().split(/\s+/)[0] : 'there');

export const SMS_TEMPLATES = {
  [CONTACT_TYPES.YOUTH]: (c) =>
    `Welcome to YEP, ${first(c.fullName)}! You're in. We supply the tools, you bring the hustle. Mentor + cohort info coming soon. - A/1 Suppliers`,
  [CONTACT_TYPES.PARENT]: (c) =>
    `Hi ${first(c.fullName)}, thanks for trusting A/1 Suppliers. Your young person is registered for the YEP Process. Updates at every stage are on the way.`,
  [CONTACT_TYPES.YOUNG_ADULT]: (c) =>
    `Welcome to Y-A.E.P., ${first(c.fullName)}! The 18-24 lane is about forward movement. Onboarding details coming next. - A/1 Suppliers`,
  [CONTACT_TYPES.MENTOR]: (c) =>
    `Thanks for stepping up as a YEP mentor, ${first(c.fullName)}. We'll reach out shortly to start onboarding + cohort matching. - A/1 Suppliers`,
  [CONTACT_TYPES.VOLUNTEER]: (c) =>
    `Thanks for volunteering with A/1 Suppliers, ${first(c.fullName)}! We'll follow up soon with onboarding + opportunities.`,
  [CONTACT_TYPES.SPONSOR]: (c) =>
    `Thank you for sponsoring the YEP Process, ${first(c.fullName)}. Our team will follow up with details + your impact. - A/1 Suppliers`,
  [CONTACT_TYPES.PARTNER]: (c) =>
    `Thanks for exploring a partnership with A/1 Suppliers, ${first(c.fullName)}. We'll be in touch to build together.`,
  [CONTACT_TYPES.GENERAL]: (c) =>
    `Hi ${first(c.fullName)}, A/1 Suppliers received your message. We'll follow up soon. - Supplying the Tools. Supporting the Hustle.`,
};

export function buildWelcomeSMS(category, contact = {}) {
  const builder = SMS_TEMPLATES[category] || SMS_TEMPLATES[CONTACT_TYPES.GENERAL];
  return builder(contact);
}
