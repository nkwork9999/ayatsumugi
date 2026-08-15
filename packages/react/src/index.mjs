'use strict';

const LABELS = Object.freeze({
  en: {
    title: 'Ayatsumugi', subtitle: 'React state session — runtime state and DOM flow', graph: 'DOM & State Graph',
    search: 'Search components, DOM, and Hooks', all: 'All', componentsTab: 'Components', stateTab: 'State',
    note: 'Select a thread to synchronize values at the same commit', tree: 'React / DOM tree',
    weave: 'DOM → Hook → data source', details: 'State inspector', liveCommit: 'live at commit',
    dom: 'DOM / Component', state: 'Hook / state', source: 'Source / flow', related: 'related nodes',
    diagnostics: 'Diagnostics', empty: 'No nodes match this filter', healthy: 'No detected anomalies',
    select: 'Select a DOM node or Hook on the left', maximize: 'Expand center', restore: 'Restore panes',
    updates: 'updates', age: 'age', elapsed: 'elapsed', commits: 'commits', current: 'Current value',
    hooksIn: 'Hooks in', history: 'Value history', recorded: 'Recorded at', values: 'values', events: 'events',
    review: 'Review', unknown: 'Inconclusive', good: 'Healthy', findings: 'findings', components: 'components',
    domNodes: 'DOM nodes', hooks: 'hooks', dataFlows: 'data flows', noHooks: 'No Hook samples',
  },
  ja: {
    title: 'Ayatsumugi', subtitle: 'React状態セッション — 実行時の状態とDOMの流れ', graph: 'DOM・ステートグラフ',
    search: 'コンポーネント・DOM・Hookを検索', all: 'すべて', componentsTab: '部品', stateTab: '状態',
    note: '3本の糸を選ぶと、同じコミットの値へ同期します', tree: 'React / DOMツリー',
    weave: 'DOM → Hook → データ源', details: '状態インスペクター', liveCommit: '選択中のコミット',
    dom: 'DOM / コンポーネント', state: 'Hook / 状態', source: 'データ源 / 流れ', related: '関連節点',
    diagnostics: '診断', empty: 'この条件に一致する節点はありません', healthy: '検出された異常はありません',
    select: '左のDOMまたはHookを選択してください', maximize: '中央を拡大', restore: '3ペインに戻す',
    updates: '回更新', age: '経過', elapsed: '継続', commits: 'コミット', current: '現在値',
    hooksIn: 'Hook一覧:', history: '値の履歴', recorded: '記録時点', values: '個の値', events: '個のイベント',
    review: '要確認', unknown: '判定不能', good: '健全', findings: '診断', components: 'コンポーネント',
    domNodes: 'DOM節点', hooks: 'Hook', dataFlows: 'データフロー', noHooks: 'Hookの標本はありません',
  },
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
function glyphOf(node) { const lane = laneOf(node); return lane === 'state' ? 'H' : lane === 'source' ? 'D' : /host/i.test(kindOf(node)) ? '<>' : 'C'; }
function valueOf(node) { const value = node?.state ?? node?.value ?? node?.currentValue; if (value == null || value === '') return 'undefined'; return typeof value === 'string' ? value : JSON.stringify(value); }
function depthOf(node, byId) { let depth = 0; let parent = node?.parent; while (parent != null && byId.has(String(parent)) && depth < 8) { depth += 1; parent = byId.get(String(parent))?.parent; } return depth; }

function createAyatsumugiReact(React) {
  if (!React || typeof React.createElement !== 'function' || typeof React.useState !== 'function') throw new TypeError('createAyatsumugiReact requires a React-compatible runtime');

  function useAyatsumugiSnapshots(store) {
    if (typeof React.useSyncExternalStore !== 'function') return store.getSnapshot();
    return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  }

  function AyatsumugiExplorer({ snapshots = [], language = 'en', initialSource = 'ayatori', className = '' }) {
    const [locale, setLocale] = React.useState(language);
    const [source, setSource] = React.useState(initialSource);
    const [selectedId, setSelectedId] = React.useState(null);
    const [left, setLeft] = React.useState(320);
    const [right, setRight] = React.useState(350);
    const [maximized, setMaximized] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [view, setView] = React.useState('all');
    const [commit, setCommit] = React.useState(null);
    const t = LABELS[locale] || LABELS.en;
    const snapshot = snapshots.find(item => item.source === source) || snapshots[0] || {};
    const nodes = snapshot.nodes || [];
    const edges = snapshot.edges || [];
    const diagnostics = snapshot.diagnostics || [];
    const byId = new Map(nodes.map(node => [String(node.id), node]));
    const selected = byId.get(String(selectedId)) || nodes.find(node => /component/i.test(kindOf(node))) || nodes[0] || null;
    const diagnosticsFor = node => diagnostics.filter(item => (item.nodeIds || []).map(String).includes(String(node.id)));
    const severityFor = node => { const list = diagnosticsFor(node); return list.some(x => severityOf(x) === 'error') ? 'error' : list.some(x => severityOf(x) === 'warning') ? 'warning' : list.length ? 'info' : ''; };
    const commitCount = Math.max(1, Number(snapshot.commitCount || snapshot.commits || 0), ...nodes.map(node => Number(node.commitSpan || 0)));
    const activeCommit = commit == null ? Math.max(0, commitCount - 1) : Math.min(commit, Math.max(0, commitCount - 1));
    const isUnknown = /unknown|inconclusive|degraded/i.test(String(snapshot.status || ''));
    const counts = {
      components: nodes.filter(node => /component|fiber/i.test(kindOf(node))).length,
      dom: nodes.filter(node => /host|dom/i.test(kindOf(node))).length,
      hooks: nodes.filter(node => laneOf(node) === 'state').length,
    };
    const metricsFor = node => [node.updateCount != null ? `${node.updateCount} ${t.updates}` : null, node.ageMs != null ? `${t.age} ${Math.round(node.ageMs)} ms` : null, node.elapsedMs != null ? `${t.elapsed} ${Math.round(node.elapsedMs)} ms` : null, node.commitSpan != null ? `${node.commitSpan} ${t.commits}` : null].filter(Boolean).join(' · ');
    const matchesView = node => view === 'all' || (view === 'dom' && /host|dom/i.test(kindOf(node))) || (view === 'component' && /component|fiber/i.test(kindOf(node))) || (view === 'state' && laneOf(node) === 'state');
    const filteredNodes = nodes.filter(matchesView).filter(node => !query || `${safeLabel(node)} ${kindOf(node)}`.toLowerCase().includes(query.toLowerCase()));
    const connected = new Set(selected ? [String(selected.id)] : []);
    for (let pass = 0; pass < nodes.length; pass += 1) {
      const before = connected.size;
      nodes.forEach(node => { if (connected.has(String(node.parent))) connected.add(String(node.id)); });
      edges.forEach(edge => {
        const from = String(edge.from); const to = String(edge.to);
        if (connected.has(from)) connected.add(to);
        if (connected.has(to)) connected.add(from);
      });
      if (connected.size === before) break;
    }
    const contextNodes = selected ? nodes.filter(node => connected.has(String(node.id))) : nodes;
    const visibleNodes = contextNodes.length > 1 ? contextNodes : nodes.slice(0, 90);
    const lanes = ['dom', 'state', 'source'];
    const laneNodes = Object.fromEntries(lanes.map(lane => [lane, visibleNodes.filter(node => laneOf(node) === lane)]));
    const positions = new Map();
    lanes.forEach((lane, laneIndex) => laneNodes[lane].forEach((node, index) => positions.set(String(node.id), { x: 142 + laneIndex * 300, y: 72 + index * 93 })));
    const graphHeight = Math.max(300, ...lanes.map(lane => laneNodes[lane].length * 93 + 90));
    const edgePaths = edges.map(edge => { const from = positions.get(String(edge.from)); const to = positions.get(String(edge.to)); if (!from || !to) return null; const mid = (from.x + to.x) / 2; const kind = String(edge.kind || '').toLowerCase(); return h(React, 'path', { key: edgeKey(edge), className: `ayatsumugi-edge ${/(update|write)/.test(kind) ? 'update' : /(flow|fetch|derive|target|subscribe)/.test(kind) ? 'flow' : ''}`, d: `M ${from.x + 94} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x - 94} ${to.y}`, 'data-edge-from': edge.from, 'data-edge-to': edge.to }); }).filter(Boolean);
    const beginResize = side => event => { const startX = event.clientX; const start = side === 'left' ? left : right; const move = next => side === 'left' ? setLeft(Math.max(220, start + next.clientX - startX)) : setRight(Math.max(260, start - next.clientX + startX)); const up = () => { globalThis.removeEventListener?.('pointermove', move); globalThis.removeEventListener?.('pointerup', up); }; globalThis.addEventListener?.('pointermove', move); globalThis.addEventListener?.('pointerup', up); };
    const selectNode = node => setSelectedId(node.id);
    const nodeCard = node => h(React, 'button', { key: node.id, type: 'button', className: `ayatsumugi-node-card ${String(node.id) === String(selected?.id) ? 'selected' : ''} ${severityFor(node) ? `has-${severityFor(node)}` : ''}`, onClick: () => selectNode(node), 'data-node-id': node.id }, h(React, 'strong', null, safeLabel(node)), h(React, 'small', null, `${kindOf(node).toUpperCase()} · node ${node.id}`), laneOf(node) === 'state' ? h(React, 'span', { className: 'ayatsumugi-value' }, valueOf(node)) : null, metricsFor(node) ? h(React, 'span', { className: 'ayatsumugi-node-metrics' }, metricsFor(node)) : null);
    const treeRows = filteredNodes.length ? filteredNodes.map(node => h(React, 'button', { key: node.id, type: 'button', className: `ayatsumugi-tree-row ${String(node.id) === String(selected?.id) ? 'selected' : ''}`, style: { '--depth': depthOf(node, byId) }, onClick: () => selectNode(node) }, h(React, 'span', { className: `ayatsumugi-glyph ${laneOf(node)}` }, glyphOf(node)), h(React, 'span', { className: 'ayatsumugi-tree-label' }, safeLabel(node), h(React, 'small', null, `${kindOf(node).toUpperCase()} · #${node.id}`)), severityFor(node) ? h(React, 'i', { className: `ayatsumugi-changed-dot severity-${severityFor(node)}` }) : h(React, 'span', null))) : h(React, 'p', { className: 'ayatsumugi-empty' }, t.empty);
    const selectedHooks = selected ? nodes.filter(node => laneOf(node) === 'state' && (String(node.parent) === String(selected.id) || edges.some(edge => String(edge.from) === String(selected.id) && String(edge.to) === String(node.id)))) : [];
    const selectedDiagnostics = selected ? diagnosticsFor(selected) : [];
    const healthLabel = diagnostics.length ? t.review : isUnknown ? t.unknown : t.good;
    const metrics = [
      { className: `health ${diagnostics.length ? 'finding' : isUnknown ? 'unknown' : ''}`, value: healthLabel, label: `${diagnostics.length} ${t.findings}` },
      { value: counts.components, label: t.components }, { value: counts.dom, label: t.domNodes },
      { value: counts.hooks, label: t.hooks }, { value: edges.length, label: t.dataFlows }, { value: commitCount, label: t.commits },
    ];
    return h(React, 'section', { className: `ayatsumugi-explorer ${maximized ? 'focus-center' : ''} ${className}`.trim(), style: { '--left-pane': `${left}px`, '--right-pane': `${right}px` }, 'data-language': locale },
      h(React, 'header', { className: 'ayatsumugi-masthead' },
        h(React, 'div', { className: 'ayatsumugi-brand' }, h(React, 'div', { className: 'ayatsumugi-mark' }, '綾'), h(React, 'div', null, h(React, 'h1', null, t.title), h(React, 'p', null, t.subtitle))),
        h(React, 'div', { className: 'ayatsumugi-statusline' }, metrics.map((metric, index) => h(React, 'div', { key: index, className: `ayatsumugi-metric ${metric.className || ''}` }, h(React, 'b', null, metric.value), h(React, 'span', null, metric.label))))),
      h(React, 'nav', { className: 'ayatsumugi-toolbar', 'aria-label': 'Display filters' },
        h(React, 'input', { className: 'ayatsumugi-search', type: 'search', value: query, placeholder: t.search, onChange: event => setQuery(event.target.value) }),
        h(React, 'div', { className: 'ayatsumugi-segmented' }, [['all', t.all], ['dom', 'DOM'], ['component', t.componentsTab], ['state', t.stateTab]].map(([id, label]) => h(React, 'button', { key: id, type: 'button', className: view === id ? 'active' : '', onClick: () => setView(id) }, label))),
        snapshots.length > 1 ? h(React, 'select', { className: 'ayatsumugi-source', value: source, onChange: event => { setSource(event.target.value); setSelectedId(null); } }, snapshots.map(item => h(React, 'option', { key: item.source, value: item.source }, item.source))) : null,
        h(React, 'span', { className: 'ayatsumugi-toolbar-note' }, t.note),
        h(React, 'div', { className: 'ayatsumugi-segmented ayatsumugi-language' }, h(React, 'button', { type: 'button', className: locale === 'ja' ? 'active' : '', onClick: () => setLocale('ja') }, '日本語'), h(React, 'button', { type: 'button', className: locale === 'en' ? 'active' : '', onClick: () => setLocale('en') }, 'English'))),
      h(React, 'main', { className: 'ayatsumugi-workspace' },
        h(React, 'section', { className: 'ayatsumugi-pane ayatsumugi-tree-pane' }, h(React, 'div', { className: 'ayatsumugi-pane-head' }, h(React, 'h2', null, t.tree), h(React, 'span', { className: 'ayatsumugi-count' }, `${filteredNodes.length} / ${nodes.length}`)), h(React, 'div', { className: 'ayatsumugi-tree-scroll' }, h(React, 'div', { className: 'ayatsumugi-tree' }, treeRows))),
        h(React, 'button', { type: 'button', className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('left'), 'aria-label': 'Resize left pane' }),
        h(React, 'section', { className: 'ayatsumugi-pane ayatsumugi-center-pane' }, h(React, 'div', { className: 'ayatsumugi-pane-head' }, h(React, 'h2', null, t.weave), h(React, 'div', { className: 'ayatsumugi-pane-actions' }, h(React, 'span', { className: 'ayatsumugi-count' }, `${visibleNodes.length} ${t.related}`), h(React, 'button', { type: 'button', className: 'ayatsumugi-icon-button', onClick: () => setMaximized(value => !value) }, maximized ? t.restore : t.maximize))), h(React, 'div', { className: 'ayatsumugi-weave' }, h(React, 'div', { className: 'ayatsumugi-weave-grid', style: { minHeight: `${graphHeight}px` } }, h(React, 'svg', { className: 'ayatsumugi-weave-svg', viewBox: `0 0 900 ${graphHeight}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, edgePaths), lanes.map(lane => h(React, 'div', { key: lane, className: `ayatsumugi-lane ${lane}` }, h(React, 'h3', { className: 'ayatsumugi-lane-title' }, t[lane]), h(React, 'div', { className: 'ayatsumugi-lane-stack' }, laneNodes[lane].length ? laneNodes[lane].map(nodeCard) : h(React, 'p', { className: 'ayatsumugi-empty' }, '—'))))))),
        h(React, 'button', { type: 'button', className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('right'), 'aria-label': 'Resize right pane' }),
        h(React, 'aside', { className: 'ayatsumugi-pane ayatsumugi-inspector' }, h(React, 'div', { className: 'ayatsumugi-pane-head' }, h(React, 'h2', null, t.details), h(React, 'span', { className: 'ayatsumugi-count' }, t.liveCommit)), h(React, 'div', { className: 'ayatsumugi-inspector-scroll' }, selected ? h(React, 'div', null,
          h(React, 'div', { className: 'ayatsumugi-eyebrow' }, kindOf(selected).toUpperCase()), h(React, 'h2', { className: 'ayatsumugi-inspect-title' }, safeLabel(selected)), h(React, 'p', { className: 'ayatsumugi-inspect-sub' }, `node ${selected.id} · runtime observation`),
          h(React, 'div', { className: 'ayatsumugi-section' }, h(React, 'h3', null, `${t.current} · commit ${activeCommit}`), h(React, 'div', { className: 'ayatsumugi-current-value' }, valueOf(selected))),
          h(React, 'div', { className: 'ayatsumugi-section' }, h(React, 'h3', null, `${t.hooksIn} ${safeLabel(selected)}`), selectedHooks.length ? h(React, 'div', { className: 'ayatsumugi-hook-list' }, selectedHooks.map(node => h(React, 'button', { key: node.id, type: 'button', className: 'ayatsumugi-hook-row', onClick: () => selectNode(node) }, h(React, 'span', null, h(React, 'b', null, safeLabel(node)), h(React, 'small', null, kindOf(node))), h(React, 'code', null, valueOf(node))))) : h(React, 'div', { className: 'ayatsumugi-empty' }, t.noHooks)),
          h(React, 'div', { className: 'ayatsumugi-section' }, h(React, 'h3', null, t.history), h(React, 'div', { className: 'ayatsumugi-history' }, h(React, 'div', { className: 'ayatsumugi-history-row' }, h(React, 'span', null, `c${activeCommit}`), h(React, 'i', { className: 'ayatsumugi-pin' }), h(React, 'span', { className: 'ayatsumugi-history-value' }, valueOf(selected))))),
          h(React, 'div', { className: 'ayatsumugi-section' }, h(React, 'h3', null, t.diagnostics), selectedDiagnostics.length ? selectedDiagnostics.map((item, index) => h(React, 'article', { key: index, className: `ayatsumugi-finding ${severityOf(item) === 'warning' ? 'warn' : ''}` }, h(React, 'b', null, `${item.code || 'INFO'} · ${severityOf(item)}`), h(React, 'p', null, item.message))) : h(React, 'div', { className: 'ayatsumugi-empty' }, t.healthy))) : h(React, 'div', { className: 'ayatsumugi-empty' }, t.select)))),
      h(React, 'footer', { className: 'ayatsumugi-timeline' }, h(React, 'div', { className: 'ayatsumugi-commit-label' }, h(React, 'span', null, t.recorded), h(React, 'b', null, `commit ${activeCommit}`)), h(React, 'input', { type: 'range', min: 0, max: Math.max(0, commitCount - 1), value: activeCommit, onChange: event => setCommit(Number(event.target.value)), 'aria-label': 'Select commit' }), h(React, 'div', { className: 'ayatsumugi-change-summary' }, `${nodes.filter(node => node.updateCount).length} ${t.values} · ${edges.length} ${t.events}`)),
    );
  }

  function ConnectedAyatsumugiExplorer({ store, ...props }) { return h(React, AyatsumugiExplorer, { ...props, snapshots: useAyatsumugiSnapshots(store) }); }
  return { AyatsumugiExplorer, ConnectedAyatsumugiExplorer, useAyatsumugiSnapshots };
}

export { LABELS, createAyatsumugiReact, safeLabel, laneOf };
export default { LABELS, createAyatsumugiReact, safeLabel, laneOf };
