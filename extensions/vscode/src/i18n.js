'use strict';

const messages = Object.freeze({
  en: {
    title: 'Runtime Map', ayatori: 'Ayatori', tsumugi: 'Tsumugi',
    graph: 'Unified Graph', details: 'Details', refresh: 'Refresh',
    maximize: 'Maximize center', restore: 'Restore layout', disconnected: 'Not connected',
  },
  ja: {
    title: '実行時マップ', ayatori: 'Ayatori', tsumugi: 'Tsumugi',
    graph: '統合グラフ', details: '詳細', refresh: '再読み込み',
    maximize: '中央を最大化', restore: '配置を戻す', disconnected: '未接続',
  },
});

function language(value) { return value === 'ja' ? 'ja' : 'en'; }
function t(lang, key) { return messages[language(lang)][key] || key; }

module.exports = { language, messages, t };

