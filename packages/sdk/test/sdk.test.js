'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { disconnected, validateEnvelope } = require('../src');

test('creates a valid disconnected envelope', () => {
  const value = disconnected('ayatori', 'not installed');
  assert.equal(validateEnvelope('ayatori', value), value);
  assert.equal(value.diagnostics[0].code, 'CORE-DISCONNECTED');
});

test('rejects a source mismatch', () => {
  assert.throws(
    () => validateEnvelope('tsumugi', disconnected('ayatori', 'missing')),
    /incompatible/,
  );
});
