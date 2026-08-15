'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createAyatsumugiReact, LABELS } = require('../src');

function runtime() {
  return { createElement: (type, props, ...children) => ({ type, props: props || {}, children }), useState: value => [value, () => {}], useSyncExternalStore: (_subscribe, get) => get() };
}

function flatten(node, result = []) {
  if (!node || typeof node !== 'object') return result;
  result.push(node);
  for (const child of node.children || []) Array.isArray(child) ? child.forEach(item => flatten(item, result)) : flatten(child, result);
  return result;
}

function textContent(node) {
  if (node == null) return '';
  if (typeof node !== 'object') return String(node);
  return (node.children || []).flat(Infinity).map(textContent).join('');
}

test('renders DOM/state nodes and resize separators', () => {
  const { AyatsumugiExplorer } = createAyatsumugiReact(runtime());
  const tree = AyatsumugiExplorer({ snapshots: [{ protocolVersion: 1, source: 'ayatori', status: 'ready', nodes: [{ id: '1', kind: 'HostN', label: 'button' }], edges: [], diagnostics: [] }] });
  const nodes = flatten(tree);
  assert.equal(nodes.filter(node => node.props?.role === 'separator').length, 2);
  assert.ok(nodes.some(node => node.props?.['data-node-id'] === '1'));
});

test('English defaults and Japanese remains available', () => {
  assert.equal(LABELS.en.graph, 'DOM & State Graph');
  assert.equal(LABELS.ja.graph, 'DOM・ステートグラフ');
});

test('links diagnostics to nodes and renders update, elapsed, and commit metrics', () => {
  const { AyatsumugiExplorer } = createAyatsumugiReact(runtime());
  const tree = AyatsumugiExplorer({ snapshots: [{
    protocolVersion: 1,
    source: 'ayatori',
    status: 'findings',
    nodes: [{ id: '2', kind: 'SlotN', label: 'useQuery', updateCount: 9, elapsedMs: 3200, commitSpan: 10 }],
    edges: [],
    diagnostics: [{ code: 'SC-01', severity: 'warning', message: 'Copied state diverged', nodeIds: ['2'] }],
  }] });
  const nodes = flatten(tree);
  assert.ok(nodes.some(node => node.props?.className?.includes('has-warning')));
  assert.ok(nodes.some(node => node.props?.className?.includes('severity-warning')));
  assert.match(textContent(tree), /9 updates/);
  assert.match(textContent(tree), /elapsed 3200 ms/);
  assert.match(textContent(tree), /10 commits/);
});
