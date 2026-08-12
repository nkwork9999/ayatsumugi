'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { locateSidecar } = require('../src/core-locator');

test('configured absolute sidecar path has priority', () => {
  const file = path.resolve('/opt/ayatsumugi/ayatsumugi-mcp');
  assert.equal(locateSidecar({ configured: file, exists: value => value === file, env: {} }), file);
});

test('sidecar uses one environment variable for both products', () => {
  const file = path.resolve('/cores/ayatsumugi-mcp');
  assert.equal(locateSidecar({ env: { AYATSUMUGI_MCP_BIN: file }, exists: value => value === file }), file);
});
