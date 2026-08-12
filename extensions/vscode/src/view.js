'use strict';

const { t, language } = require('./i18n');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function buildHtml(langValue, snapshots, nonce = 'ayatsumugi') {
  const lang = language(langValue);
  const data = JSON.stringify(snapshots).replace(/</g, '\\u003c');
  const sourceCard = source => {
    const snapshot = snapshots.find(item => item.source === source);
    const status = snapshot?.status || 'disconnected';
    return `<button class="source" data-source="${source}"><strong>${t(lang, source)}</strong><span>${escapeHtml(status)}</span></button>`;
  };
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'">
<style nonce="${nonce}">
:root{color-scheme:light dark;font:13px var(--vscode-font-family,system-ui);--line:var(--vscode-panel-border,#5555)}*{box-sizing:border-box}body{margin:0;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);overflow:hidden}header{height:42px;display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--line)}header h1{font-size:14px;margin:0 auto 0 0}button{font:inherit;color:inherit;background:var(--vscode-button-secondaryBackground,#5554);border:0;border-radius:5px;padding:6px 9px}.layout{height:calc(100vh - 42px);display:grid;grid-template-columns:minmax(150px,22%) 5px minmax(260px,1fr) 5px minmax(170px,25%)}.pane{min-width:0;overflow:auto;padding:10px}.split{cursor:col-resize;background:var(--line)}.source{width:100%;display:flex;justify-content:space-between;margin-bottom:8px}.source span{opacity:.75}.center{position:relative}.center.max{position:fixed;inset:42px 0 0;z-index:5;background:var(--vscode-editor-background)}#graph{min-height:320px;border:1px dashed var(--line);border-radius:8px;padding:12px}.node{padding:8px;margin:6px;border:1px solid var(--line);border-radius:7px;display:inline-block}.hidden{display:none!important}
</style></head><body><header><h1>${t(lang, 'title')}</h1><button id="refresh">${t(lang, 'refresh')}</button><button id="maximize">${t(lang, 'maximize')}</button></header>
<main class="layout" id="layout"><aside class="pane">${sourceCard('ayatori')}${sourceCard('tsumugi')}</aside><div class="split" data-split="left"></div><section class="pane center" id="center"><h2>${t(lang, 'graph')}</h2><div id="graph"></div></section><div class="split" data-split="right"></div><aside class="pane" id="details"><h2>${t(lang, 'details')}</h2></aside></main>
<script nonce="${nonce}">const vscode=acquireVsCodeApi();const snapshots=${data};const graph=document.querySelector('#graph');const details=document.querySelector('#details');const center=document.querySelector('#center');const max=document.querySelector('#maximize');function draw(source){const selected=snapshots.find(x=>x.source===source);graph.innerHTML='';details.querySelectorAll('pre').forEach(x=>x.remove());for(const node of selected?.nodes||[]){const el=document.createElement('button');el.className='node';el.textContent=node.label;el.onclick=()=>{const pre=document.createElement('pre');pre.textContent=JSON.stringify(node,null,2);details.append(pre)};graph.append(el)}if(!graph.children.length)graph.textContent=selected?.diagnostics?.[0]?.message||'${t(lang, 'disconnected')}'}document.querySelectorAll('.source').forEach(x=>x.onclick=()=>draw(x.dataset.source));document.querySelector('#refresh').onclick=()=>vscode.postMessage({type:'refresh'});max.onclick=()=>{center.classList.toggle('max');max.textContent=center.classList.contains('max')?'${t(lang, 'restore')}':'${t(lang, 'maximize')}'};for(const split of document.querySelectorAll('.split'))split.onpointerdown=e=>{split.setPointerCapture(e.pointerId);split.onpointermove=m=>{const w=innerWidth;if(split.dataset.split==='left')document.querySelector('#layout').style.gridTemplateColumns=Math.max(150,m.clientX)+'px 5px minmax(260px,1fr) 5px minmax(170px,25%)';else document.querySelector('#layout').style.gridTemplateColumns='minmax(150px,22%) 5px minmax(260px,1fr) 5px '+Math.max(170,w-m.clientX)+'px'}};draw('ayatori');</script></body></html>`;
}

module.exports = { buildHtml, escapeHtml };

