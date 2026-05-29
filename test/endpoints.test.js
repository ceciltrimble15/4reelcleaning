'use strict';

/**
 * Endpoint tests. Boots the server on an ephemeral port and exercises every
 * route with the native fetch client. No external dependencies; runs entirely
 * in dry-run mode.
 */

const assert = require('assert');
const { createServer } = require('../src/server');

let passed = 0;
let failed = 0;

function check(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}`);
  }
}

async function main() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  async function req(method, path, body, headers) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch (_e) {
      /* non-JSON */
    }
    return { status: res.status, json, headers: res.headers };
  }

  try {
    // --- GET /api/health ---
    const health = await req('GET', '/api/health');
    check('health 200', health.status === 200);
    check('health status ok', health.json && health.json.status === 'ok');
    check('health dryRun true by default', health.json && health.json.dryRun === true);
    check('health lists vendors', health.json && !!health.json.vendors.airtable);

    // --- POST /api/intake (valid) ---
    const intake = await req('POST', '/api/intake', {
      formType: 'youth',
      name: 'Jordan Test',
      email: 'jordan@example.com',
      phone: '+1 555 123 4567',
      message: 'Interested in the youth program.',
    });
    check('intake 200', intake.status === 200);
    check('intake ok', intake.json && intake.json.ok === true);
    check('intake dryRun', intake.json && intake.json.dryRun === true);
    check('intake saved to Youth_Intake', intake.json && intake.json.airtable.table === 'Youth_Intake');
    check('intake returns simulated record id', intake.json && /^recDRYRUN/.test(intake.json.airtable.id));
    check('intake sms simulated', intake.json && intake.json.sms.ok === true);
    check('intake email simulated', intake.json && intake.json.email.ok === true);

    // --- POST /api/intake (invalid) ---
    const bad = await req('POST', '/api/intake', { formType: 'youth' });
    check('intake invalid 400', bad.status === 400);
    check('intake invalid reports errors', bad.json && Array.isArray(bad.json.details) && bad.json.details.length > 0);

    // --- POST /api/intake (unknown form type) ---
    const unknownType = await req('POST', '/api/intake', { formType: 'spaceship', name: 'X', email: 'x@y.com' });
    check('intake unknown formType 400', unknownType.status === 400);

    // --- partner_donor alias resolution ---
    const partner = await req('POST', '/api/intake', { formType: 'donor', name: 'Pat Donor', email: 'pat@example.com' });
    check('intake donor->Partner_Donor_Intake', partner.json && partner.json.airtable.table === 'Partner_Donor_Intake');

    // --- POST /api/sms/send ---
    const sms = await req('POST', '/api/sms/send', { to: '+15551234567', body: 'Hello from A1' });
    check('sms 200', sms.status === 200);
    check('sms simulated sid', sms.json && /^SMDRYRUN/.test(sms.json.sid));

    const smsBad = await req('POST', '/api/sms/send', { to: '' });
    check('sms invalid 400', smsBad.status === 400);

    // --- POST /api/email/send ---
    const email = await req('POST', '/api/email/send', {
      to: 'someone@example.com',
      subject: 'Test',
      text: 'Body',
    });
    check('email 200', email.status === 200);
    check('email simulated messageId', email.json && /@dry-run\.local$/.test(email.json.messageId));

    const emailBad = await req('POST', '/api/email/send', { to: 'not-an-email', subject: 'x', text: 'y' });
    check('email invalid 400', emailBad.status === 400);

    // --- CORS: disallowed origin blocked ---
    const blocked = await req('GET', '/api/health', null, { Origin: 'https://evil.example.com' });
    check('cors blocks disallowed origin', blocked.status === 403);

    // --- CORS: allowed origin passes + header echoed ---
    const allowed = await req('GET', '/api/health', null, { Origin: 'https://a1suppliers.org' });
    check('cors allows approved origin', allowed.status === 200);
    check(
      'cors echoes allow-origin header',
      allowed.headers.get('access-control-allow-origin') === 'https://a1suppliers.org'
    );

    // --- 404 ---
    const notFound = await req('GET', '/api/nope');
    check('unknown route 404', notFound.status === 404);

    // --- invalid JSON body ---
    const rawRes = await fetch(base + '/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not json',
    });
    check('invalid JSON 400', rawRes.status === 400);
  } finally {
    server.close();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
