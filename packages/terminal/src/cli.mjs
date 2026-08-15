#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { detectHost, locateSidecar, renderHtml, renderText, snapshot } from './index.mjs';

function args(values) {
  const result = { command: values[0] || 'help' };
  for (let index = 1; index < values.length; index++) {
    const value = values[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    result[key] = !next || next.startsWith('--') ? true : values[++index];
  }
  return result;
}

const options = args(process.argv.slice(2));
if (options.command === 'help' || options.help) {
  process.stdout.write('Usage: ayatsumugi <doctor|snapshot|html> [--source ayatori|tsumugi] [--input path] [--sidecar path] [--output path]\n');
  process.exit(0);
}
const host = detectHost();
const sidecar = await locateSidecar({ configured: options.sidecar || '' });
if (options.command === 'doctor') {
  process.stdout.write(`${JSON.stringify({ host, sidecar, ready: Boolean(sidecar) }, null, 2)}\n`);
  process.exit(sidecar ? 0 : 1);
}
const envelope = await snapshot({ source: options.source, input: options.input, sidecar });
if (options.command === 'snapshot') {
  process.stdout.write(options.json ? `${JSON.stringify(envelope, null, 2)}\n` : renderText(envelope, host));
} else if (options.command === 'html') {
  const output = options.output || 'ayatsumugi-snapshot.html';
  await writeFile(output, renderHtml(envelope, host), { encoding: 'utf8', flag: 'w' });
  process.stdout.write(`${output}\n`);
} else {
  throw new Error(`Unknown command: ${options.command}`);
}
