'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { locateCore } = require('../src/core-locator');

test('configured absolute core path has priority', () => {
  const file = path.resolve('/opt/ayatsumugi/ayatori-core');
  assert.equal(locateCore('ayatori', { configured: file, exists: value => value === file, env: {} }), file);
});

test('Tsumugi and Ayatori use separate environment variables', () => {
  const ayatori = path.resolve('/cores/ayatori');
  const tsumugi = path.resolve('/cores/tsumugi');
  const env = { AYATORI_CORE_BIN: ayatori, TSUMUGI_CORE_BIN: tsumugi };
  const exists = value => value === ayatori || value === tsumugi;
  assert.equal(locateCore('ayatori', { env, exists }), ayatori);
  assert.equal(locateCore('tsumugi', { env, exists }), tsumugi);
});

