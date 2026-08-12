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
