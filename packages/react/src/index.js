'use strict';

const LABELS = Object.freeze({
  en: { title: 'Ayatsumugi', subtitle: 'React runtime state and DOM flow', graph: 'DOM & State Graph', tree: 'React / DOM tree', weave: 'DOM → state → data source', details: 'State inspector', diagnostics: 'Diagnostics', empty: 'No observed nodes', healthy: 'No detected anomalies', select: 'Select a node to inspect its state', maximize: 'Expand center', restore: 'Restore panes', updates: 'updates', age: 'age', elapsed: 'elapsed', commits: 'commits', current: 'Current value', evidence: 'Evidence', dom: 'DOM / Component', state: 'Hook / state', source: 'Source / flow', nodes: 'nodes', connected: 'connected', findings: 'findings' },
  ja: { title: 'Ayatsumugi', subtitle: 'Reactの実行時ステートとDOMの流れ', graph: 'DOM・ステートグラフ', tree: 'React / DOMツリー', weave: 'DOM → 状態 → データ源', details: '状態インスペクター', diagnostics: '診断', empty: '観測されたノードはありません', healthy: '検出された異常はありません', select: 'ノードを選ぶと状態を確認できます', maximize: '中央を拡大', restore: '3ペインに戻す', updates: '回更新', age: '経過', elapsed: '継続', commits: 'コミット', current: '現在値', evidence: '根拠', dom: 'DOM / コンポーネント', state: 'Hook / 状態', source: 'データ源 / フロー', nodes: 'ノード', connected: '接続中', findings: '件の診断' },
});

function h(React, type, props, ...children) { return React.createElement(type, props, ...children); }
function edgeKey(edge) { return `${edge.from}:${edge.to}:${edge.kind}`; }
function severityOf(item) { const value = String(item?.severity || '').toLowerCase(); return ['error', 'warning', 'info'].includes(value) ? value : 'info'; }
function kindOf(node) { return String(node?.kind || 'Node').replace(/N$/, ''); }
function laneOf(node) { const kind = kindOf(node).toLowerCase(); if (/(slot|hook|state|atom|signal)/.test(kind)) return 'state'; if (/(store|query|mutation|endpoint|provider|source|function|resource)/.test(kind)) return 'source'; return 'dom'; }
function looksLikeCode(value) { return value.length > 72 || /=>|\bfunction\s*\(|\b(return|document|window|const|let|var)\b|[{};]/.test(value); }
function safeLabel(node) {
  const raw = String(node?.label || '').trim();
  if (raw && !looksLikeCode(raw)) return raw;
  const kind = kindOf(node);
  if (/host/i.test(kind)) return `<${String(node?.tag || 'element')}>`;
  if (/slot|hook|state/i.test(kind)) return `State #${node?.id ?? '?'}`;
  if (/component|fiber/i.test(kind)) return `Component #${node?.id ?? '?'}`;
  return `${kind} #${node?.id ?? '?'}`;
}
function glyphOf(node) { const lane = laneOf(node); return lane === 'state' ? 'S' : lane === 'source' ? 'D' : /host/i.test(kindOf(node)) ? '<>' : 'C'; }
function valueOf(node) { const value = node?.state ?? node?.value ?? node?.currentValue; if (value == null || value === '') return '—'; return typeof value === 'string' ? value : JSON.stringify(value); }

function createAyatsumugiReact(React) {
  if (!React || typeof React.createElement !== 'function' || typeof React.useState !== 'function') throw new TypeError('createAyatsumugiReact requires a React-compatible runtime');

  function useAyatsumugiSnapshots(store) {
    if (typeof React.useSyncExternalStore !== 'function') return store.getSnapshot();
    return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  }

  function AyatsumugiExplorer({ snapshots = [], language = 'en', initialSource = 'ayatori', className = '' }) {
    const [locale, setLocale] = React.useState(language);
    const t = LABELS[locale] || LABELS.en;
    const [source, setSource] = React.useState(initialSource);
    const [selectedId, setSelectedId] = React.useState(null);
    const [left, setLeft] = React.useState(280);
    const [right, setRight] = React.useState(320);
    const [maximized, setMaximized] = React.useState(false);
    const snapshot = snapshots.find(item => item.source === source) || snapshots[0] || {};
    const nodes = snapshot.nodes || [];
    const edges = snapshot.edges || [];
    const diagnostics = snapshot.diagnostics || [];
    const selected = nodes.find(node => String(node.id) === String(selectedId)) || null;
    const diagnosticsFor = node => diagnostics.filter(item => (item.nodeIds || []).map(String).includes(String(node.id)));
    const severityFor = node => { const list = diagnosticsFor(node); return list.some(x => severityOf(x) === 'error') ? 'error' : list.some(x => severityOf(x) === 'warning') ? 'warning' : list.length ? 'info' : ''; };
    const severityCounts = diagnostics.reduce((sum, item) => ({ ...sum, [severityOf(item)]: (sum[severityOf(item)] || 0) + 1 }), {});
    const metricsFor = node => [node.updateCount != null ? `${node.updateCount} ${t.updates}` : null, node.ageMs != null ? `${t.age} ${Math.round(node.ageMs)} ms` : null, node.elapsedMs != null ? `${t.elapsed} ${Math.round(node.elapsedMs)} ms` : null, node.commitSpan != null ? `${node.commitSpan} ${t.commits}` : null].filter(Boolean).join(' · ');
    const beginResize = side => event => {
      const startX = event.clientX;
      const start = side === 'left' ? left : right;
      const move = next => side === 'left' ? setLeft(Math.max(200, start + next.clientX - startX)) : setRight(Math.max(240, start - next.clientX + startX));
      const up = () => { globalThis.removeEventListener?.('pointermove', move); globalThis.removeEventListener?.('pointerup', up); };
      globalThis.addEventListener?.('pointermove', move); globalThis.addEventListener?.('pointerup', up);
    };
    const selectDiagnostic = item => { const id = (item.nodeIds || [])[0]; if (id != null) setSelectedId(id); };
    const lanes = ['dom', 'state', 'source'];
    const laneNodes = Object.fromEntries(lanes.map(lane => [lane, nodes.filter(node => laneOf(node) === lane)]));
    const positions = new Map();
    lanes.forEach((lane, laneIndex) => laneNodes[lane].forEach((node, index) => positions.set(String(node.id), { x: 140 + laneIndex * 300, y: 70 + index * 116 })));
    const height = Math.max(310, ...lanes.map(lane => laneNodes[lane].length * 116 + 100));
    const edgePaths = edges.map(edge => { const from = positions.get(String(edge.from)); const to = positions.get(String(edge.to)); if (!from || !to) return null; const mid = (from.x + to.x) / 2; return h(React, 'path', { key: edgeKey(edge), className: `ayatsumugi-edge edge-${String(edge.kind || 'flow').toLowerCase()}`, d: `M ${from.x + 92} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x - 92} ${to.y}`, 'data-edge-from': edge.from, 'data-edge-to': edge.to }); }).filter(Boolean);
    const nodeCard = node => { const severity = severityFor(node); const related = diagnosticsFor(node); return h(React, 'button', { key: node.id, type: 'button', className: `ayatsumugi-node lane-${laneOf(node)} ${severity ? `has-${severity}` : ''} ${String(node.id) === String(selectedId) ? 'is-selected' : ''}`.trim(), onClick: () => setSelectedId(node.id), 'data-node-id': node.id }, h(React, 'strong', null, safeLabel(node)), h(React, 'small', null, `${kindOf(node)} · #${node.id}`), laneOf(node) === 'state' ? h(React, 'span', { className: 'ayatsumugi-value' }, valueOf(node)) : null, metricsFor(node) ? h(React, 'span', { className: 'ayatsumugi-metrics' }, metricsFor(node)) : null, related.length ? h(React, 'b', { className: `ayatsumugi-node-badge severity-${severity}` }, related.length) : null); };
    const treeRows = nodes.length ? nodes.map(node => h(React, 'button', { key: node.id, type: 'button', className: `ayatsumugi-tree-row ${String(node.id) === String(selectedId) ? 'is-selected' : ''}`, onClick: () => setSelectedId(node.id) }, h(React, 'span', { className: `ayatsumugi-glyph lane-${laneOf(node)}` }, glyphOf(node)), h(React, 'span', { className: 'ayatsumugi-tree-label' }, safeLabel(node), h(React, 'small', null, `${kindOf(node)} · #${node.id}`)), severityFor(node) ? h(React, 'i', { className: `ayatsumugi-alert-dot severity-${severityFor(node)}` }) : null)) : h(React, 'p', { className: 'ayatsumugi-empty' }, t.empty);
    const diagnosticList = diagnostics.length ? diagnostics.map((item, index) => h(React, 'button', { key: `${item.code || 'diagnostic'}:${index}`, type: 'button', className: `ayatsumugi-diagnostic severity-${severityOf(item)}`, onClick: () => selectDiagnostic(item) }, h(React, 'span', null, severityOf(item)), h(React, 'strong', null, item.code || 'INFO'), h(React, 'p', null, item.message), item.evidence ? h(React, 'small', null, typeof item.evidence === 'string' ? item.evidence : JSON.stringify(item.evidence)) : null)) : h(React, 'p', { className: 'ayatsumugi-healthy' }, t.healthy);
    return h(React, 'section', { className: `ayatsumugi-explorer ${maximized ? 'is-maximized' : ''} ${className}`.trim(), style: { '--ayatsumugi-left': `${left}px`, '--ayatsumugi-right': `${right}px` }, 'data-language': locale },
      h(React, 'header', { className: 'ayatsumugi-masthead' }, h(React, 'div', { className: 'ayatsumugi-brand' }, h(React, 'span', { className: 'ayatsumugi-mark' }, '綾'), h(React, 'span', null, h(React, 'h1', null, t.title), h(React, 'small', null, t.subtitle))), h(React, 'div', { className: 'ayatsumugi-summary' }, h(React, 'b', null, nodes.length), h(React, 'span', null, t.nodes), h(React, 'b', { className: severityCounts.error ? 'severity-error' : '' }, diagnostics.length), h(React, 'span', null, t.findings), h(React, 'span', { className: 'ayatsumugi-live' }, snapshot.status || t.connected), h(React, 'button', { type: 'button', onClick: () => setLocale(value => value === 'en' ? 'ja' : 'en'), 'aria-label': 'Switch language' }, locale === 'en' ? '日本語' : 'English'))),
      h(React, 'div', { className: 'ayatsumugi-layout' },
        h(React, 'nav', { className: 'ayatsumugi-pane ayatsumugi-tree', 'aria-label': 'Sources' }, h(React, 'div', { className: 'ayatsumugi-pane-head' }, h(React, 'h2', null, t.tree), h(React, 'select', { value: source, onChange: event => { setSource(event.target.value); setSelectedId(null); }, 'aria-label': 'Source' }, snapshots.map(item => h(React, 'option', { key: item.source, value: item.source }, item.source))), h(React, 'span', null, nodes.length)), h(React, 'div', { className: 'ayatsumugi-tree-scroll' }, treeRows)),
        h(React, 'div', { className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('left') }),
        h(React, 'main', { className: 'ayatsumugi-pane ayatsumugi-center' }, h(React, 'div', { className: 'ayatsumugi-pane-head' }, h(React, 'h2', null, t.weave), h(React, 'span', null, `${edges.length} flows`), h(React, 'button', { type: 'button', onClick: () => setMaximized(value => !value) }, maximized ? t.restore : t.maximize)), h(React, 'div', { className: 'ayatsumugi-weave' }, h(React, 'div', { className: 'ayatsumugi-weave-grid', style: { minHeight: `${height}px` } }, h(React, 'svg', { className: 'ayatsumugi-edge-layer', viewBox: `0 0 900 ${height}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, edgePaths), lanes.map(lane => h(React, 'section', { key: lane, className: `ayatsumugi-lane lane-${lane}` }, h(React, 'h3', null, t[lane]), h(React, 'div', null, laneNodes[lane].length ? laneNodes[lane].map(nodeCard) : h(React, 'p', { className: 'ayatsumugi-empty' }, '—'))))))),
        h(React, 'div', { className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('right') }),
        h(React, 'aside', { className: 'ayatsumugi-pane ayatsumugi-inspector' }, h(React, 'div', { className: 'ayatsumugi-pane-head' }, h(React, 'h2', null, t.details)), h(React, 'div', { className: 'ayatsumugi-inspector-scroll' }, selected ? h(React, 'div', null, h(React, 'span', { className: 'ayatsumugi-eyebrow' }, kindOf(selected)), h(React, 'h3', null, safeLabel(selected)), h(React, 'code', null, `node #${selected.id}`), h(React, 'section', null, h(React, 'h4', null, t.current), h(React, 'pre', { className: 'ayatsumugi-current-value' }, valueOf(selected))), h(React, 'section', null, h(React, 'h4', null, t.diagnostics), diagnosticsFor(selected).length ? diagnosticsFor(selected).map((item, index) => h(React, 'div', { key: index, className: `ayatsumugi-finding severity-${severityOf(item)}` }, h(React, 'b', null, item.code || severityOf(item)), h(React, 'p', null, item.message))) : h(React, 'p', { className: 'ayatsumugi-healthy' }, t.healthy))) : h(React, 'p', { className: 'ayatsumugi-empty' }, t.select), h(React, 'section', { className: 'ayatsumugi-all-diagnostics' }, h(React, 'h4', null, t.diagnostics), diagnosticList))),
      ),
    );
  }

  function ConnectedAyatsumugiExplorer({ store, ...props }) { return h(React, AyatsumugiExplorer, { ...props, snapshots: useAyatsumugiSnapshots(store) }); }
  return { AyatsumugiExplorer, ConnectedAyatsumugiExplorer, useAyatsumugiSnapshots };
}

module.exports = { LABELS, createAyatsumugiReact, safeLabel, laneOf };
