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

class TsumugiWasmClient {
  constructor(exports) {
    const required = ['ayatsumugi_abi_version', 'ayatsumugi_store_create', 'ayatsumugi_store_dispose', 'ayatsumugi_source_int', 'ayatsumugi_node_set_int', 'ayatsumugi_node_peek_int', 'ayatsumugi_store_snapshot'];
    for (const name of required) {
      if (typeof exports?.[name] !== 'function') throw new Error(`Tsumugi Wasm ABI is missing ${name}`);
    }
    if (exports.ayatsumugi_abi_version() !== 1) throw new Error('Unsupported Tsumugi Wasm ABI version');
    this.exports = exports;
  }

  createStore() { return this.exports.ayatsumugi_store_create(); }
  disposeStore(store) { return Boolean(this.exports.ayatsumugi_store_dispose(store)); }
  sourceInt(store, initial) { return this.exports.ayatsumugi_source_int(store, initial); }
  setInt(store, node, value) { return Boolean(this.exports.ayatsumugi_node_set_int(store, node, value)); }
  peekInt(node) { return this.exports.ayatsumugi_node_peek_int(node); }
  snapshot(store) {
    const value = this.exports.ayatsumugi_store_snapshot(store);
    return validateEnvelope('tsumugi', typeof value === 'string' ? JSON.parse(value) : value);
  }
}

async function instantiateTsumugiWasm(source, imports = {}, options = {}) {
  let result;
  if (source instanceof WebAssembly.Module) {
    result = { instance: await WebAssembly.instantiate(source, imports) };
  } else {
    const bytes = source instanceof ArrayBuffer ? source : await source.arrayBuffer?.() || source;
    result = await WebAssembly.instantiate(bytes, imports, options);
  }
  return new TsumugiWasmClient(result.instance?.exports || result.exports);
}

function createSnapshotStore(initial = []) {
  let snapshots = initial.map(value => validateEnvelope(value.source, value));
  const listeners = new Set();
  return {
    getSnapshot: () => snapshots,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    update(next) {
      const envelope = validateEnvelope(next.source, next);
      snapshots = [...snapshots.filter(item => item.source !== envelope.source), envelope];
      for (const listener of listeners) listener();
      return snapshots;
    },
  };
}

module.exports = {
  PROTOCOL_VERSION,
  SOURCES,
  assertSource,
  createSnapshotStore,
  disconnected,
  instantiateTsumugiWasm,
  TsumugiWasmClient,
  validateEnvelope,
};
