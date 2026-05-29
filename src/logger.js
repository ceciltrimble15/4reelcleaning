'use strict';

/**
 * Structured JSON logger. One line per event, machine-parseable, with a
 * timestamp, level, and arbitrary structured fields.
 */

function emit(level, message, fields) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(fields || {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
  return entry;
}

module.exports = {
  info: (message, fields) => emit('info', message, fields),
  warn: (message, fields) => emit('warn', message, fields),
  error: (message, fields) => emit('error', message, fields),
  debug: (message, fields) =>
    process.env.NODE_ENV === 'development' ? emit('debug', message, fields) : null,
};
