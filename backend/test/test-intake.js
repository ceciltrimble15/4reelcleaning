// Dry-run test runner for the intake engine.
// Forces AUTOMATION_DRY_RUN so no live email/SMS/Airtable calls are made, then
// exercises every contact type, the validation path, and duplicate protection.
//
// Run:  npm test   (from the backend/ directory)

process.env.AUTOMATION_DRY_RUN = 'true';

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  ✗ ${name} ${detail ? `-> ${detail}` : ''}`);
  }
}

const main = async () => {
  // Dynamic import AFTER env is set so config picks up dry-run mode.
  const { handleIntake } = await import('../src/handler.js');
  const { CONTACT_TYPES } = await import('../src/services/classify.js');
  const { payloadList, payloads } = await import('./payloads.js');

  const expectedCategory = {
    youth: CONTACT_TYPES.YOUTH,
    parent: CONTACT_TYPES.PARENT,
    youngAdult: CONTACT_TYPES.YOUNG_ADULT,
    mentor: CONTACT_TYPES.MENTOR,
    volunteer: CONTACT_TYPES.VOLUNTEER,
    sponsor: CONTACT_TYPES.SPONSOR,
    partner: CONTACT_TYPES.PARTNER,
    general: CONTACT_TYPES.GENERAL,
  };

  console.log('\n=== Contact-type coverage (8 types) ===');
  for (const { key, body } of payloadList) {
    const res = await handleIntake(body);
    check(`${key}: HTTP 200`, res.status === 200, `got ${res.status}`);
    check(`${key}: classified as ${expectedCategory[key]}`, res.body.category === expectedCategory[key], res.body.category);
    check(`${key}: contact id assigned`, Boolean(res.body.contactId));
    const emailAction = res.body.actions.find((a) => a.actionType === 'welcome-email');
    const smsAction = res.body.actions.find((a) => a.actionType === 'welcome-sms');
    const alertAction = res.body.actions.find((a) => a.actionType === 'internal-alert');
    check(`${key}: welcome email simulated`, emailAction && emailAction.status === 'simulated', emailAction && emailAction.status);
    check(`${key}: welcome sms simulated`, smsAction && smsAction.status === 'simulated', smsAction && smsAction.status);
    check(`${key}: internal alert simulated`, alertAction && alertAction.status === 'simulated', alertAction && alertAction.status);
  }

  console.log('\n=== Duplicate protection ===');
  // Re-submit the youth payload — second time must be detected as a duplicate
  // and the welcome email/SMS must be skipped (not re-sent).
  const second = await handleIntake(payloads.youth);
  check('duplicate detected on resubmit', second.body.duplicate === true, String(second.body.duplicate));
  const dupEmail = second.body.actions.find((a) => a.actionType === 'welcome-email');
  const dupSms = second.body.actions.find((a) => a.actionType === 'welcome-sms');
  check('duplicate welcome email skipped', dupEmail && dupEmail.status === 'skipped-duplicate', dupEmail && dupEmail.status);
  check('duplicate welcome sms skipped', dupSms && dupSms.status === 'skipped-duplicate', dupSms && dupSms.status);

  console.log('\n=== Validation ===');
  const bad = await handleIntake({ email: 'not-an-email' });
  check('missing name + bad email rejected (400)', bad.status === 400, String(bad.status));
  check('validation errors returned', Array.isArray(bad.body.errors) && bad.body.errors.length > 0);

  const badPhone = await handleIntake({ fullName: 'No Phone', phone: '123' });
  check('invalid phone rejected (400)', badPhone.status === 400, String(badPhone.status));

  console.log('\n=== Logging ===');
  const { _memory } = await import('../src/services/airtable.js');
  check('automation actions logged to Automation_Log', _memory.logs.length > 0, `${_memory.logs.length} rows`);

  console.log(`\n${'='.repeat(40)}\nRESULT: ${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.log('Failures:', failures.join(', '));
    process.exit(1);
  }
};

main().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
