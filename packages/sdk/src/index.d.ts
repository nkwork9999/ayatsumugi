export type AyatsumugiSource = 'ayatori' | 'tsumugi';

export interface Diagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export interface Envelope {
  protocolVersion: 1;
  source: AyatsumugiSource;
  status: string;
  nodes: unknown[];
  edges: unknown[];
  diagnostics: Diagnostic[];
}

export const PROTOCOL_VERSION: 1;
export const SOURCES: readonly AyatsumugiSource[];
export function assertSource(source: string): AyatsumugiSource;
export function disconnected(source: AyatsumugiSource, reason: unknown): Envelope;
export function validateEnvelope(source: AyatsumugiSource, value: unknown): Envelope;
export interface TsumugiWasmExports {
  ayatsumugi_abi_version(): number;
  ayatsumugi_store_create(): number;
  ayatsumugi_store_dispose(store: number): number;
  ayatsumugi_source_int(store: number, initial: number): number;
  ayatsumugi_node_set_int(store: number, node: number, value: number): number;
  ayatsumugi_node_peek_int(node: number): number;
  ayatsumugi_store_snapshot(store: number): string | Envelope;
}
export class TsumugiWasmClient {
  constructor(exports: TsumugiWasmExports);
  createStore(): number;
  disposeStore(store: number): boolean;
  sourceInt(store: number, initial: number): number;
  setInt(store: number, node: number, value: number): boolean;
  peekInt(node: number): number;
  snapshot(store: number): Envelope;
}
export function instantiateTsumugiWasm(source: BufferSource | WebAssembly.Module | Response, imports?: WebAssembly.Imports, options?: object): Promise<TsumugiWasmClient>;
export function createSnapshotStore(initial?: Envelope[]): {
  getSnapshot(): Envelope[];
  subscribe(listener: () => void): () => void;
  update(next: Envelope): Envelope[];
};
