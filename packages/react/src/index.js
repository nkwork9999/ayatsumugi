'use strict';

const LABELS = Object.freeze({
  en: { title: 'Ayatsumugi', graph: 'DOM & State Graph', details: 'Details', diagnostics: 'Diagnostics', empty: 'No observed nodes', healthy: 'No detected anomalies', maximize: 'Maximize center', restore: 'Restore panes', updates: 'updates', age: 'age', elapsed: 'elapsed', commits: 'commits' },
  ja: { title: 'Ayatsumugi', graph: 'DOM・ステートグラフ', details: '詳細', diagnostics: '診断', empty: '観測されたノードはありません', healthy: '検出された異常はありません', maximize: '中央を拡大', restore: '分割表示に戻す', updates: '回更新', age: '経過', elapsed: '継続', commits: 'コミット' },
});

function h(React, type, props, ...children) { return React.createElement(type, props, ...children); }
function edgeKey(edge) { return `${edge.from}:${edge.to}:${edge.kind}`; }

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
    const [selected, setSelected] = React.useState(null);
    const [left, setLeft] = React.useState(220);
    const [right, setRight] = React.useState(260);
    const [maximized, setMaximized] = React.useState(false);
    const snapshot = snapshots.find(item => item.source === source) || snapshots[0];
    const nodes = snapshot?.nodes || [];
    const edges = snapshot?.edges || [];
    const diagnostics = snapshot?.diagnostics || [];
    const normalizedSeverity = item => ['error', 'warning', 'info'].includes(String(item.severity).toLowerCase()) ? String(item.severity).toLowerCase() : 'info';
    const severityCounts = diagnostics.reduce((counts, item) => { const severity = normalizedSeverity(item); return { ...counts, [severity]: (counts[severity] || 0) + 1 }; }, {});
    const diagnosticsFor = node => diagnostics.filter(item => item.nodeIds?.map(String).includes(String(node.id)));
    const metricsFor = node => [node.updateCount != null ? `${node.updateCount} ${t.updates}` : null, node.ageMs != null ? `${t.age} ${Math.round(node.ageMs)} ms` : null, node.elapsedMs != null ? `${t.elapsed} ${Math.round(node.elapsedMs)} ms` : null, node.commitSpan != null ? `${node.commitSpan} ${t.commits}` : null].filter(Boolean).join(' · ');
    const beginResize = side => event => {
      const startX = event.clientX;
      const start = side === 'left' ? left : right;
      const move = next => side === 'left' ? setLeft(Math.max(160, start + next.clientX - startX)) : setRight(Math.max(180, start - next.clientX + startX));
      const up = () => { globalThis.removeEventListener?.('pointermove', move); globalThis.removeEventListener?.('pointerup', up); };
      globalThis.addEventListener?.('pointermove', move);
      globalThis.addEventListener?.('pointerup', up);
    };
    const nodeView = nodes.length ? nodes.map(node => {
      const related = diagnosticsFor(node);
      const severity = related.some(item => normalizedSeverity(item) === 'error') ? 'error' : related.some(item => normalizedSeverity(item) === 'warning') ? 'warning' : related.some(item => normalizedSeverity(item) === 'info') ? 'info' : '';
      return h(React, 'button', { key: node.id, type: 'button', className: `ayatsumugi-node kind-${String(node.kind).toLowerCase()} ${severity ? `has-${severity}` : ''}`.trim(), onClick: () => setSelected(node), 'data-node-id': node.id }, h(React, 'strong', null, node.label), node.state ? h(React, 'span', null, node.state) : null, metricsFor(node) ? h(React, 'small', null, metricsFor(node)) : null, related.length ? h(React, 'b', { className: `ayatsumugi-node-badge severity-${severity}` }, related.length) : null);
    }) : h(React, 'p', { className: 'ayatsumugi-empty' }, t.empty);
    const diagnosticView = diagnostics.length ? h(React, 'div', { className: 'ayatsumugi-diagnostic-list' }, diagnostics.map((item, index) => { const severity = normalizedSeverity(item); return h(React, 'button', { key: `${item.code || 'diagnostic'}:${index}`, type: 'button', className: `ayatsumugi-diagnostic severity-${severity}`, onClick: () => { const linked = nodes.find(node => item.nodeIds?.map(String).includes(String(node.id))); setSelected(linked ? { ...linked, diagnostic: item } : { diagnostic: item }); } }, h(React, 'span', { className: 'ayatsumugi-severity' }, severity), h(React, 'strong', null, item.code || 'INFO'), h(React, 'span', null, item.message)); })) : h(React, 'p', { className: 'ayatsumugi-healthy' }, t.healthy);
    return h(React, 'section', { className: `ayatsumugi-explorer ${maximized ? 'is-maximized' : ''} ${className}`.trim(), style: { '--ayatsumugi-left': `${left}px`, '--ayatsumugi-right': `${right}px` }, 'data-language': locale },
      h(React, 'header', null, h(React, 'h1', null, t.title), h(React, 'button', { type: 'button', className: 'ayatsumugi-language', onClick: () => setLocale(value => value === 'en' ? 'ja' : 'en'), 'aria-label': 'Switch language' }, locale === 'en' ? '日本語' : 'English'), h(React, 'button', { type: 'button', onClick: () => setMaximized(value => !value) }, maximized ? t.restore : t.maximize)),
      h(React, 'div', { className: 'ayatsumugi-layout' },
        h(React, 'nav', { className: 'ayatsumugi-sources', 'aria-label': 'Sources' }, snapshots.map(item => h(React, 'button', { key: item.source, type: 'button', className: item.source === source ? 'is-active' : '', onClick: () => { setSource(item.source); setSelected(null); } }, item.source, h(React, 'span', null, item.status))), h(React, 'section', { className: 'ayatsumugi-health-summary' }, h(React, 'h2', null, t.diagnostics), h(React, 'div', null, h(React, 'span', { className: 'severity-error' }, `${severityCounts.error || 0} error`), h(React, 'span', { className: 'severity-warning' }, `${severityCounts.warning || 0} warning`), h(React, 'span', { className: 'severity-info' }, `${severityCounts.info || 0} info`)))),
        h(React, 'div', { className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('left') }),
        h(React, 'main', { className: 'ayatsumugi-graph' }, h(React, 'h2', null, t.diagnostics), diagnosticView, h(React, 'h2', null, t.graph), h(React, 'div', { className: 'ayatsumugi-nodes' }, nodeView), h(React, 'ol', { className: 'ayatsumugi-edges' }, edges.map(edge => h(React, 'li', { key: edgeKey(edge) }, `${edge.from} → ${edge.to} · ${edge.kind}`)))),
        h(React, 'div', { className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('right') }),
        h(React, 'aside', { className: 'ayatsumugi-details' }, h(React, 'h2', null, t.details), h(React, 'pre', null, selected ? JSON.stringify(selected, null, 2) : '—')),
      ),
    );
  }

  function ConnectedAyatsumugiExplorer({ store, ...props }) { return h(React, AyatsumugiExplorer, { ...props, snapshots: useAyatsumugiSnapshots(store) }); }
  return { AyatsumugiExplorer, ConnectedAyatsumugiExplorer, useAyatsumugiSnapshots };
}

module.exports = { LABELS, createAyatsumugiReact };
