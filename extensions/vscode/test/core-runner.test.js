'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { snapshotCore, validateEnvelope } = require('../src/core-runner');

const envelope = source => ({ protocolVersion: 1, source, status: 'ready', nodes: [], edges: [], diagnostics: [] });

test('validates that independent cores identify themselves', () => {
  assert.equal(validateEnvelope('ayatori', envelope('ayatori')).source, 'ayatori');
  assert.throws(() => validateEnvelope('tsumugi', envelope('ayatori')), /incompatible/);
});

test('missing executable becomes a disconnected result', async () => {
  const result = await snapshotCore('tsumugi', null);
  assert.equal(result.status, 'disconnected');
  assert.equal(result.source, 'tsumugi');
});

test('parses a core snapshot without sharing implementation code', async () => {
  const run = async () => ({ stdout: JSON.stringify(envelope('ayatori')) });
  assert.deepEqual(await snapshotCore('ayatori', '/private/ayatori-core', run), envelope('ayatori'));
});

