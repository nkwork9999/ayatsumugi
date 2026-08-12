'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SIDECAR_SPEC = Object.freeze({ setting: 'sidecarPath', env: 'AYATSUMUGI_MCP_BIN', commands: ['ayatsumugi-mcp'] });

function executableNames(name, platform = process.platform) {
  return platform === 'win32' ? [`${name}.exe`, `${name}.cmd`, name] : [name];
}

function usable(file, exists = fs.existsSync) {
  return Boolean(file && path.isAbsolute(file) && exists(file));
}

function locateSidecar(options = {}) {
  const spec = SIDECAR_SPEC;
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

module.exports = { SIDECAR_SPEC, locateSidecar };
