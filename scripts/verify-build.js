'use strict';

/**
 * Build verification: require every source module so syntax errors and bad
 * imports surface immediately, without starting the server or hitting vendors.
 */

const path = require('path');

const modules = [
  '../src/config',
  '../src/logger',
  '../src/services/validation',
  '../src/services/airtable',
  '../src/services/twilio',
  '../src/services/email',
  '../src/services/messageLog',
  '../src/routes/health',
  '../src/routes/intake',
  '../src/routes/sms',
  '../src/routes/email',
  '../src/server',
];

let failed = 0;
for (const m of modules) {
  try {
    require(m);
    console.log(`  ok   ${path.basename(m)}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL ${m}: ${err.message}`);
  }
}

if (failed) {
  console.error(`\nBuild verification FAILED (${failed} module(s)).`);
  process.exit(1);
}
console.log('\nBuild verification passed: all modules load cleanly.');
