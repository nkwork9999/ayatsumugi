import assert from 'node:assert/strict';
import test from 'node:test';
import { detectHost, renderHtml, renderText, snapshot } from '../src/index.mjs';

const envelope = { protocolVersion: 1, source: 'ayatori', status: 'ready', nodes: [{ id: 'a', label: 'App', state: 'mounted' }], edges: [], diagnostics: [] };

test('detects supported terminal hosts', () => {
  assert.equal(detectHost({ TERM_PROGRAM: 'ghostty' }), 'ghostty');
  assert.equal(detectHost({ CMUX_SOCKET: '/tmp/cmux' }), 'cmux');
  assert.equal(detectHost({ HERDR_SOCKET: '/tmp/herdr' }), 'herdr');
  assert.equal(detectHost({ ORCA_SESSION_ID: '1' }), 'orca');
});

test('runs the private sidecar through the public protocol', async () => {
  const value = await snapshot({ source: 'ayatori', input: '/tmp/trace.jsonl', sidecar: '/tmp/sidecar', run: async (_bin, argv) => {
    assert.deepEqual(argv.slice(0, 4), ['snapshot', '--source', 'ayatori', '--input']);
    return { stdout: JSON.stringify(envelope) };
  } });
  assert.equal(value.nodes[0].label, 'App');
});

test('renders terminal and local HTML views without executable content from labels', () => {
  assert.match(renderText(envelope, 'ghostty'), /ghostty/);
  assert.match(renderHtml({ ...envelope, nodes: [{ id: 'x', label: '<script>' }] }, 'cmux'), /\\u003cscript>/);
});
