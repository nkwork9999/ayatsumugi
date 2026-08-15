import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import process from 'node:process';

const root = new URL('../', import.meta.url);
const forbiddenNames = new Set(['moon.mod.json', 'moon.mod', 'moon.pkg.json', 'moon.pkg']);
const forbiddenExtensions = new Set(['.mbt', '.mbti', '.map']);
const forbiddenBinaryExtensions = new Set([
  '.wasm', '.node', '.dylib', '.so', '.dll', '.exe', '.a', '.lib',
]);
const forbiddenText = [
  /rule_(?:sc|sb|ow|dm)\d+/i,
  /docs\/design\/verified/i,
  /observer\/src\/(?:walk|extract|hook)\.mjs/i,
  /BEGIN (?:RSA |OPENSSH )?PRIVATE KEY/,
  /components\/(?:ayatori|tsumugi)\/src/i,
  /ayatsumugi-core\/components/i,
  /\/Users\/[^/\s"'`]+\//,
  /\/home\/[^/\s"'`]+\//,
  /[A-Za-z]:\\Users\\[^\\\s"'`]+\\/,
  /~\/Desktop\//,
  /Documents\/Codex\//,
  /(?:npm|gh[pousr])_[A-Za-z0-9_-]{20,}/,
  /(?:VSCE_PAT|AZURE_DEVOPS_EXT_PAT|NPM_TOKEN)\s*[:=]\s*["']?[^\s"']+/,
  /\/\/registry\.npmjs\.org\/:_authToken\s*=/,
];
const ignored = new Set(['.git', 'node_modules', 'target', 'dist', 'coverage']);
const failures = [];

async function walk(url) {
  for (const entry of await readdir(url, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, url);
    const path = child.pathname;
    if (entry.isDirectory()) {
      await walk(child);
      continue;
    }
    const rel = relative(root.pathname, path);
    if (
      forbiddenNames.has(entry.name)
      || forbiddenExtensions.has(extname(entry.name))
      || forbiddenBinaryExtensions.has(extname(entry.name))
    ) {
      failures.push(`${rel}: forbidden public artifact`);
      continue;
    }
    const data = await readFile(path);
    if (data.includes(0)) continue;
    const text = data.toString('utf8');
    for (const pattern of forbiddenText) {
      if (pattern.test(`${rel}\n${text}`)) failures.push(`${rel}: matched ${pattern}`);
    }
  }
}

await walk(root);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('[boundary] public tree contains no recognized private-core artifacts');
