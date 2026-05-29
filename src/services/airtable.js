'use strict';

/**
 * Airtable service.
 *
 * Persists records to the configured Airtable base/tables. In dry-run mode it
 * logs the intended write and returns a simulated record id without making any
 * network call. The `airtable` SDK is lazily required only when live.
 */

const config = require('../config');
const logger = require('../logger');

let _base = null;
function getBase() {
  if (_base) return _base;
  // Lazy require so the engine runs in dry-run without the dependency installed.
  const Airtable = require('airtable');
  _base = new Airtable({ apiKey: config.airtable.apiKey }).base(config.airtable.baseId);
  return _base;
}

/**
 * Create a record in a table identified by its canonical key.
 * @param {string} tableKey - one of config.airtable.tables keys
 * @param {object} fields - Airtable field map
 * @returns {Promise<{ok: boolean, dryRun: boolean, id: string|null, table: string, error?: string}>}
 */
async function createRecord(tableKey, fields) {
  const tableName = config.airtable.tables[tableKey];
  if (!tableName) {
    return { ok: false, dryRun: config.dryRun, id: null, table: tableKey, error: `Unknown table key "${tableKey}".` };
  }

  if (!config.isLive('airtable')) {
    const simulatedId = 'recDRYRUN' + Math.random().toString(36).slice(2, 12);
    logger.info('airtable.createRecord (dry-run)', { table: tableName, tableKey, fields, simulatedId });
    return { ok: true, dryRun: true, id: simulatedId, table: tableName };
  }

  try {
    const created = await getBase()(tableName).create([{ fields }]);
    const id = Array.isArray(created) && created[0] ? created[0].getId() : null;
    logger.info('airtable.createRecord (live)', { table: tableName, tableKey, id });
    return { ok: true, dryRun: false, id, table: tableName };
  } catch (err) {
    logger.error('airtable.createRecord failed', { table: tableName, tableKey, error: err.message });
    return { ok: false, dryRun: false, id: null, table: tableName, error: err.message };
  }
}

module.exports = { createRecord };
