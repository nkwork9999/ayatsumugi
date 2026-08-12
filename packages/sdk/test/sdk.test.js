'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { TsumugiWasmClient, createSnapshotStore, disconnected, validateEnvelope } = require('../src');

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

test('wraps the narrow Tsumugi Wasm ABI', () => {
  let value = 1;
  const client = new TsumugiWasmClient({
    ayatsumugi_abi_version: () => 1,
    ayatsumugi_store_create: () => 3,
    ayatsumugi_store_dispose: () => 1,
    ayatsumugi_source_int: () => 4,
    ayatsumugi_node_set_int: (_store, _node, next) => { value = next; return 1; },
    ayatsumugi_node_peek_int: () => value,
    ayatsumugi_store_snapshot: () => JSON.stringify({ protocolVersion: 1, source: 'tsumugi', status: 'ready', nodes: [], edges: [], diagnostics: [] }),
  });
  assert.equal(client.createStore(), 3);
  assert.equal(client.sourceInt(3, 1), 4);
  assert.equal(client.setInt(3, 4, 9), true);
  assert.equal(client.peekInt(4), 9);
  assert.equal(client.snapshot(3).source, 'tsumugi');
});

test('snapshot store notifies clients', () => {
  const store = createSnapshotStore();
  let changes = 0;
  const stop = store.subscribe(() => changes++);
  store.update(disconnected('ayatori', 'offline'));
  stop();
  assert.equal(changes, 1);
  assert.equal(store.getSnapshot()[0].source, 'ayatori');
});
