'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CORE_SPECS = Object.freeze({
  ayatori: {
    setting: 'ayatoriCorePath',
    env: 'AYATORI_CORE_BIN',
    commands: ['ayatori-core', 'ayatori'],
  },
  tsumugi: {
    setting: 'tsumugiCorePath',
    env: 'TSUMUGI_CORE_BIN',
    commands: ['tsumugi-devtools-core', 'tsumugi-core'],
  },
});

function executableNames(name, platform = process.platform) {
  return platform === 'win32' ? [`${name}.exe`, `${name}.cmd`, name] : [name];
}

function usable(file, exists = fs.existsSync) {
  return Boolean(file && path.isAbsolute(file) && exists(file));
}

function locateCore(source, options = {}) {
  const spec = CORE_SPECS[source];
  if (!spec) throw new Error(`Unknown core source: ${source}`);
  const exists = options.exists || fs.existsSync;
  const configured = options.configured || '';
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  if (usable(configured, exists)) return configured;
  if (usable(env[spec.env], exists)) return env[spec.env];
  const dirs = String(env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const command of spec.commands) {
      for (const name of executableNames(command, platform)) {
        const candidate = path.resolve(dir, name);
        if (exists(candidate)) return candidate;
      }
    }
  }
  return null;
}

module.exports = { CORE_SPECS, locateCore };

