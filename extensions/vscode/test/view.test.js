'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildHtml } = require('../src/view');

const snapshots = [
  { protocolVersion: 1, source: 'ayatori', status: 'ready', nodes: [], edges: [], diagnostics: [] },
  { protocolVersion: 1, source: 'tsumugi', status: 'ready', nodes: [], edges: [], diagnostics: [] },
];

test('English is the default language', () => {
  const html = buildHtml(undefined, snapshots);
  assert.match(html, /Unified Graph/);
  assert.doesNotMatch(html, /統合グラフ/);
});

test('Japanese can be selected', () => {
  assert.match(buildHtml('ja', snapshots), /統合グラフ/);
});

test('view includes resize splitters and center maximization', () => {
  const html = buildHtml('en', snapshots);
  assert.match(html, /data-split="left"/);
  assert.match(html, /data-split="right"/);
  assert.match(html, /classList\.toggle\('max'\)/);
});

