'use strict';

const LABELS = Object.freeze({
  en: { title: 'Ayatsumugi', graph: 'DOM & State Graph', details: 'Details', empty: 'No observed nodes', maximize: 'Maximize center', restore: 'Restore panes' },
  ja: { title: 'Ayatsumugi', graph: 'DOM・ステートグラフ', details: '詳細', empty: '観測されたノードはありません', maximize: '中央を拡大', restore: '分割表示に戻す' },
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
    const t = LABELS[language] || LABELS.en;
    const [source, setSource] = React.useState(initialSource);
    const [selected, setSelected] = React.useState(null);
    const [left, setLeft] = React.useState(220);
    const [right, setRight] = React.useState(260);
    const [maximized, setMaximized] = React.useState(false);
    const snapshot = snapshots.find(item => item.source === source) || snapshots[0];
    const nodes = snapshot?.nodes || [];
    const edges = snapshot?.edges || [];
    const beginResize = side => event => {
      const startX = event.clientX;
      const start = side === 'left' ? left : right;
      const move = next => side === 'left' ? setLeft(Math.max(160, start + next.clientX - startX)) : setRight(Math.max(180, start - next.clientX + startX));
      const up = () => { globalThis.removeEventListener?.('pointermove', move); globalThis.removeEventListener?.('pointerup', up); };
      globalThis.addEventListener?.('pointermove', move);
      globalThis.addEventListener?.('pointerup', up);
    };
    const nodeView = nodes.length ? nodes.map(node => h(React, 'button', { key: node.id, type: 'button', className: `ayatsumugi-node kind-${String(node.kind).toLowerCase()}`, onClick: () => setSelected(node), 'data-node-id': node.id }, h(React, 'strong', null, node.label), node.state ? h(React, 'span', null, node.state) : null)) : h(React, 'p', { className: 'ayatsumugi-empty' }, t.empty);
    return h(React, 'section', { className: `ayatsumugi-explorer ${maximized ? 'is-maximized' : ''} ${className}`.trim(), style: { '--ayatsumugi-left': `${left}px`, '--ayatsumugi-right': `${right}px` }, 'data-language': language },
      h(React, 'header', null, h(React, 'h1', null, t.title), h(React, 'button', { type: 'button', onClick: () => setMaximized(value => !value) }, maximized ? t.restore : t.maximize)),
      h(React, 'div', { className: 'ayatsumugi-layout' },
        h(React, 'nav', { className: 'ayatsumugi-sources', 'aria-label': 'Sources' }, snapshots.map(item => h(React, 'button', { key: item.source, type: 'button', className: item.source === source ? 'is-active' : '', onClick: () => setSource(item.source) }, item.source, h(React, 'span', null, item.status)))),
        h(React, 'div', { className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('left') }),
        h(React, 'main', { className: 'ayatsumugi-graph' }, h(React, 'h2', null, t.graph), h(React, 'div', { className: 'ayatsumugi-nodes' }, nodeView), h(React, 'ol', { className: 'ayatsumugi-edges' }, edges.map(edge => h(React, 'li', { key: edgeKey(edge) }, `${edge.from} → ${edge.to} · ${edge.kind}`)))),
        h(React, 'div', { className: 'ayatsumugi-splitter', role: 'separator', 'aria-orientation': 'vertical', onPointerDown: beginResize('right') }),
        h(React, 'aside', { className: 'ayatsumugi-details' }, h(React, 'h2', null, t.details), h(React, 'pre', null, selected ? JSON.stringify(selected, null, 2) : '—')),
      ),
    );
  }

  function ConnectedAyatsumugiExplorer({ store, ...props }) { return h(React, AyatsumugiExplorer, { ...props, snapshots: useAyatsumugiSnapshots(store) }); }
  return { AyatsumugiExplorer, ConnectedAyatsumugiExplorer, useAyatsumugiSnapshots };
}

module.exports = { LABELS, createAyatsumugiReact };
