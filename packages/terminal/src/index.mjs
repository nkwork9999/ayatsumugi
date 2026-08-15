import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import { delimiter, isAbsolute, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
export const SOURCES = Object.freeze(['ayatori', 'tsumugi']);

export function detectHost(env = process.env) {
  const term = String(env.TERM_PROGRAM || '').toLowerCase();
  if (env.HERDR_SOCKET || env.HERDR_SESSION || term.includes('herdr')) return 'herdr';
  if (env.ORCA_WORKTREE_ID || env.ORCA_SESSION_ID || term.includes('orca')) return 'orca';
  if (env.CMUX_SOCKET || env.CMUX_WORKSPACE_ID || term.includes('cmux')) return 'cmux';
  if (term.includes('ghostty')) return 'ghostty';
  return term || 'terminal';
}

async function executable(path) {
  if (!path || !isAbsolute(path)) return false;
  try { await access(path); return true; } catch { return false; }
}

export async function locateSidecar({ configured = '', env = process.env, platform = process.platform } = {}) {
  if (await executable(configured)) return configured;
  if (await executable(env.AYATSUMUGI_MCP_BIN)) return env.AYATSUMUGI_MCP_BIN;
  const names = platform === 'win32' ? ['ayatsumugi-mcp.exe', 'ayatsumugi-mcp.cmd', 'ayatsumugi-mcp'] : ['ayatsumugi-mcp'];
  for (const dir of String(env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const name of names) {
      const candidate = resolve(dir, name);
      if (await executable(candidate)) return candidate;
    }
  }
  return null;
}

export function validateEnvelope(source, value) {
  if (!SOURCES.includes(source)) throw new Error(`Unknown source: ${source}`);
  if (!value || value.protocolVersion !== 1 || value.source !== source) throw new Error(`${source} returned an incompatible Ayatsumugi envelope`);
  for (const key of ['nodes', 'edges', 'diagnostics']) if (!Array.isArray(value[key])) throw new Error(`${source} envelope is missing ${key}`);
  return value;
}

export async function snapshot({ source, input, sidecar, run = execFileAsync }) {
  if (!SOURCES.includes(source)) throw new Error(`--source must be one of: ${SOURCES.join(', ')}`);
  if (!input) throw new Error('--input is required');
  if (!sidecar) throw new Error('ayatsumugi-mcp was not found; set AYATSUMUGI_MCP_BIN');
  const { stdout } = await run(sidecar, ['snapshot', '--source', source, '--input', input, '--format', 'ayatsumugi-v1'], {
    encoding: 'utf8', timeout: 15000, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
  });
  return validateEnvelope(source, JSON.parse(stdout));
}

export function renderText(envelope, host = 'terminal') {
  const lines = [`Ayatsumugi · ${envelope.source} · ${envelope.status} · ${host}`, `${envelope.nodes.length} nodes · ${envelope.edges.length} edges`];
  for (const node of envelope.nodes) lines.push(`  ${node.id}  ${node.label || node.kind || 'node'}${node.state ? `  [${node.state}]` : ''}`);
  for (const diagnostic of envelope.diagnostics) lines.push(`  ${diagnostic.severity}: ${diagnostic.message}`);
  return `${lines.join('\n')}\n`;
}

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }

export function renderHtml(envelope, host = 'terminal') {
  const payload = JSON.stringify(envelope).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ayatsumugi</title><style>:root{color-scheme:dark;font:14px system-ui;background:#101319;color:#e8edf5}*{box-sizing:border-box}body{margin:0}header{padding:12px 16px;border-bottom:1px solid #ffffff20;display:flex;gap:12px;align-items:center}header strong{margin-right:auto}.layout{height:calc(100vh - 49px);display:grid;grid-template-columns:220px 6px minmax(300px,1fr) 6px 280px}.pane{overflow:auto;padding:14px}.split{background:#ffffff20;cursor:col-resize}.node{display:block;width:100%;text-align:left;margin:8px 0;padding:10px;color:inherit;background:#171d27;border:1px solid #ffffff20;border-radius:8px}.muted{color:#9ca8ba}pre{white-space:pre-wrap}.max .left,.max .right,.max .split{display:none}.max{grid-template-columns:1fr}</style></head><body><header><strong>Ayatsumugi</strong><span>${escapeHtml(envelope.source)} · ${escapeHtml(host)}</span><button id="max">Maximize center</button></header><main class="layout" id="layout"><aside class="pane left"><h2>Runtime</h2><p>${escapeHtml(envelope.status)}</p><p class="muted">${envelope.nodes.length} nodes · ${envelope.edges.length} edges</p></aside><div class="split"></div><section class="pane"><h2>DOM &amp; State Graph</h2><div id="nodes"></div></section><div class="split"></div><aside class="pane right"><h2>Details</h2><pre id="details">Select a node</pre></aside></main><script>const envelope=${payload};const nodes=document.querySelector('#nodes');for(const node of envelope.nodes){const button=document.createElement('button');button.className='node';button.textContent=node.label||node.kind||node.id;button.onclick=()=>document.querySelector('#details').textContent=JSON.stringify(node,null,2);nodes.append(button)}if(!envelope.nodes.length)nodes.textContent=envelope.diagnostics[0]?.message||'No observed nodes';document.querySelector('#max').onclick=()=>document.querySelector('#layout').classList.toggle('max')</script></body></html>`;
}
