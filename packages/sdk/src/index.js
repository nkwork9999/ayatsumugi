'use strict';

const PROTOCOL_VERSION = 1;
const SOURCES = Object.freeze(['ayatori', 'tsumugi']);

function disconnected(source, reason) {
  assertSource(source);
  return {
    protocolVersion: PROTOCOL_VERSION,
    source,
    status: 'disconnected',
    nodes: [],
    edges: [],
    diagnostics: [{
      code: 'CORE-DISCONNECTED',
      severity: 'info',
      message: String(reason),
    }],
  };
}

function assertSource(source) {
  if (!SOURCES.includes(source)) throw new Error(`Unknown Ayatsumugi source: ${source}`);
  return source;
}

function validateEnvelope(source, value) {
  assertSource(source);
  if (!value || value.protocolVersion !== PROTOCOL_VERSION || value.source !== source) {
    throw new Error(`${source} returned an incompatible Ayatsumugi envelope`);
  }
  for (const key of ['nodes', 'edges', 'diagnostics']) {
    if (!Array.isArray(value[key])) throw new Error(`${source} envelope is missing ${key}`);
  }
  return value;
}

module.exports = {
  PROTOCOL_VERSION,
  SOURCES,
  assertSource,
  disconnected,
  validateEnvelope,
};
