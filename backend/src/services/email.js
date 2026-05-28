// Email service. Primary provider: Resend (REST, no SDK needed).
// SendGrid is supported by setting EMAIL_PROVIDER=sendgrid. Both use the
// documented EMAIL_PROVIDER_API_KEY env var. API keys stay server-side only.

import { config, isLive } from '../config.js';
import { buildWelcomeEmail, buildInternalAlert } from '../templates/email.js';

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.email.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: config.email.fromAddress, to: [to], subject, html, text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${JSON.stringify(data)}`);
  }
  return { id: data.id, raw: data };
}

async function sendViaSendGrid({ to, subject, html, text }) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.email.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: config.email.fromAddress },
      subject,
      content: [
        { type: 'text/plain', value: text || ' ' },
        { type: 'text/html', value: html },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SendGrid ${res.status}: ${body}`);
  }
  return { id: res.headers.get('x-message-id') || 'accepted', raw: { status: res.status } };
}

// Low-level send. Returns a normalized { status, provider, response } object.
// Never throws to the caller — failures are captured so the flow can keep going
// and the failure is logged.
async function sendEmail({ to, subject, html, text }) {
  const provider = config.email.provider;
  if (!to) {
    return { status: 'skipped', provider, response: 'no recipient address' };
  }
  if (!isLive('email')) {
    return {
      status: 'simulated',
      provider,
      response: `DRY-RUN email -> ${to} | subject: ${subject}`,
    };
  }
  try {
    const result =
      provider === 'sendgrid'
        ? await sendViaSendGrid({ to, subject, html, text })
        : await sendViaResend({ to, subject, html, text });
    return { status: 'sent', provider, response: result };
  } catch (err) {
    return { status: 'error', provider, response: null, error: err.message };
  }
}

// High-level helpers used by the intake handler.
export async function sendWelcomeEmail(category, contact) {
  const { subject, html, text } = buildWelcomeEmail(category, contact);
  return sendEmail({ to: contact.email, subject, html, text });
}

export async function sendInternalAlert(contact) {
  const { subject, html, text } = buildInternalAlert(contact);
  return sendEmail({ to: config.internalAlertEmail, subject, html, text });
}

export { sendEmail };
