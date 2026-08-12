'use strict';

const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);

function disconnected(source, reason) {
  return {
    protocolVersion: 1,
    source,
    status: 'disconnected',
    nodes: [],
    edges: [],
    diagnostics: [{ code: 'CORE-DISCONNECTED', severity: 'info', message: reason }],
  };
}

function validateEnvelope(source, value) {
  if (!value || value.protocolVersion !== 1 || value.source !== source) {
    throw new Error(`${source} returned an incompatible Ayatsumugi envelope`);
  }
  for (const key of ['nodes', 'edges', 'diagnostics']) {
    if (!Array.isArray(value[key])) throw new Error(`${source} envelope is missing ${key}`);
  }
  return value;
}

async function snapshotCore(source, executable, inputPath, run = execFileAsync) {
  if (!executable) return disconnected(source, `${source} core was not found`);
  if (!inputPath) return disconnected(source, `${source} input is not configured`);
  try {
    const { stdout } = await run(executable, ['snapshot', '--source', source, '--input', inputPath, '--format', 'ayatsumugi-v1'], {
      encoding: 'utf8',
      timeout: 15000,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });
    return validateEnvelope(source, JSON.parse(stdout));
  } catch (error) {
    return disconnected(source, error instanceof Error ? error.message : String(error));
  }
}

module.exports = { disconnected, snapshotCore, validateEnvelope };
