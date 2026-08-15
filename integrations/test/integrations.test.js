import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('Herdr manifest exposes doctor and inspect entrypoints', async () => {
  const manifest = await read('herdr/herdr-plugin.toml');
  assert.match(manifest, /id = "nkwork9999\.ayatsumugi"/);
  assert.match(manifest, /\[\[panes\]\]/);
  assert.match(manifest, /@noobknotsdev\/ayatsumugi-terminal/);
});

test('Orca manifest uses Plugin API v1 with minimum capabilities', async () => {
  const manifest = JSON.parse(await read('orca/orca-plugin.json'));
  assert.equal(manifest.pluginApi, 1);
  assert.equal(manifest.contributes.panels[0].id, 'runtime');
  assert.deepEqual(manifest.capabilities.map(item => item.kind), ['workspace:read', 'terminal:send', 'notifications:show', 'events:subscribe']);
});

test('Orca panel shell-quotes the input path', async () => {
  assert.match(await read('orca/panel.html'), /shellQuote\(input\)/);
});
