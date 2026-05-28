// Email templates for the A/1 Suppliers intake engine.
// Voice: structured, identity-driven, never generic-nonprofit.
// Slogan: "Supplying the Tools. Supporting the Hustle."
// Always "Process," never "Program." YEP leads; Y-A.E.P. is the 18-24 lane.

import { CONTACT_TYPES } from '../services/classify.js';

const SLOGAN = 'Supplying the Tools. Supporting the Hustle.';

// Minimal HTML escaper so submitted names/text can't inject markup.
function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shell(headline, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#0D1E4A">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#0D1E4A;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <div style="font-size:20px;font-weight:800;letter-spacing:.5px">A/1 SUPPLIERS &mdash; YEP</div>
      <div style="font-size:12px;color:#C8A84B;margin-top:4px">${SLOGAN}</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;line-height:1.6">
      <h1 style="font-size:22px;margin:0 0 12px">${esc(headline)}</h1>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:13px;color:#6B7A99">&mdash; The A/1 Suppliers Team<br>info@a1suppliers.org</p>
    </div>
  </div></body></html>`;
}

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const NAME = (c) => esc(c.fullName || 'there');

// Each builder returns the inner body paragraphs; shell() wraps them.
const BODIES = {
  [CONTACT_TYPES.YOUTH]: (c) => ({
    subject: 'Welcome to the YEP Process',
    body: `<p>Hey ${NAME(c)}, welcome to the <strong>Young Entrepreneurs Process (YEP)</strong>.</p>
    <p>This isn't a program &mdash; it's a Process built to give you identity, discipline, and the drive to build something real. We're going to supply the tools. You bring the hustle.</p>
    <p>Your next step: keep an eye on your phone and inbox &mdash; your mentor and cohort details are on the way.</p>`,
  }),
  [CONTACT_TYPES.PARENT]: (c) => ({
    subject: 'Your young person just started the YEP Process',
    body: `<p>Hello ${NAME(c)},</p>
    <p>Thank you for trusting A/1 Suppliers. The <strong>Young Entrepreneurs Process (YEP)</strong> is a structured Process built around identity, discipline, mentorship, and accountability for ages 7&ndash;17.</p>
    <p>You'll receive clear updates at every stage &mdash; intake, mentor match, and cohort placement. Nothing happens in your child's journey that you won't see.</p>`,
  }),
  [CONTACT_TYPES.YOUNG_ADULT]: (c) => ({
    subject: 'Welcome to Y-A.E.P. (Ages 18-24)',
    body: `<p>Welcome ${NAME(c)},</p>
    <p>You've stepped into <strong>Y-A.E.P.</strong>, the young adult lane of the A/1 Suppliers Process for ages 18&ndash;24.</p>
    <p>This lane is about forward movement: entrepreneurship, accountability, and building a better life with real structure behind you. Your onboarding details are coming next.</p>`,
  }),
  [CONTACT_TYPES.MENTOR]: (c) => ({
    subject: 'Thank you for stepping up as a YEP Mentor',
    body: `<p>Hello ${NAME(c)},</p>
    <p>Thank you for offering to mentor in the YEP Process. Mentors are the backbone of how young people move from fragmented thinking to identity and discipline.</p>
    <p>Next step: our team will reach out to begin your mentor onboarding and cohort matching.</p>`,
  }),
  [CONTACT_TYPES.VOLUNTEER]: (c) => ({
    subject: 'Welcome aboard, YEP Volunteer',
    body: `<p>Hello ${NAME(c)},</p>
    <p>Thank you for volunteering with A/1 Suppliers. Every hand helps us supply the tools and support the hustle for the young people in the YEP Process.</p>
    <p>We'll follow up shortly with volunteer onboarding and current opportunities.</p>`,
  }),
  [CONTACT_TYPES.SPONSOR]: (c) => ({
    subject: 'Thank you for sponsoring the YEP Process',
    body: `<p>Hello ${NAME(c)},</p>
    <p>Thank you for your interest in sponsoring A/1 Suppliers. Your support directly supplies the workbooks, mentorship, and cohort infrastructure behind real youth outcomes.</p>
    <p>A member of our team will reach out with sponsorship details and the impact your support creates.</p>`,
  }),
  [CONTACT_TYPES.PARTNER]: (c) => ({
    subject: 'Thank you for partnering with A/1 Suppliers',
    body: `<p>Hello ${NAME(c)},</p>
    <p>Thank you for exploring a partnership with A/1 Suppliers. We build connected systems &mdash; nothing disconnected &mdash; and strong partners help us scale the YEP Process responsibly.</p>
    <p>Our team will be in touch to discuss how we can build together.</p>`,
  }),
  [CONTACT_TYPES.GENERAL]: (c) => ({
    subject: "We received your message - A/1 Suppliers",
    body: `<p>Hello ${NAME(c)},</p>
    <p>Thank you for reaching out to A/1 Suppliers. We've received your message and a member of our team will follow up soon.</p>`,
  }),
};

// buildWelcomeEmail(category, contact) -> { subject, html, text }
export function buildWelcomeEmail(category, contact = {}) {
  const builder = BODIES[category] || BODIES[CONTACT_TYPES.GENERAL];
  const { subject, body } = builder(contact);
  const html = shell(subject, body);
  return { subject, html, text: htmlToText(html) };
}

// buildInternalAlert(contact) -> { subject, html, text } for info@a1suppliers.org
export function buildInternalAlert(contact = {}) {
  const subject = `New intake: ${esc(contact.category || 'Contact')} - ${esc(contact.fullName || 'Unknown')}`;
  const rows = [
    ['Name', contact.fullName],
    ['Category', contact.category],
    ['Email', contact.email],
    ['Phone', contact.phone],
    ['Age', contact.age],
    ['Age Group', contact.ageGroup],
    ['Interest Area', contact.interestArea],
    ['Source', contact.source],
    ['Parent/Guardian', contact.parentName],
    ['Parent Email', contact.parentEmail],
    ['Parent Phone', contact.parentPhone],
    ['Consent', contact.consent ? 'Yes' : 'No'],
    ['Message', contact.message],
  ]
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#6B7A99;vertical-align:top"><strong>${esc(k)}</strong></td><td style="padding:4px 0">${esc(v)}</td></tr>`,
    )
    .join('');
  const html = shell('New intake submission', `<table style="font-size:14px">${rows}</table>`);
  return { subject, html, text: htmlToText(html) };
}
