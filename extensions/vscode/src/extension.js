'use strict';

const vscode = require('vscode');
const crypto = require('node:crypto');
const { locateSidecar } = require('./core-locator');
const { snapshotCore } = require('./core-runner');
const { buildHtml } = require('./view');

function configuration() { return vscode.workspace.getConfiguration('ayatsumugi'); }

async function snapshots() {
  const config = configuration();
  const sidecar = locateSidecar({ configured: config.get('sidecarPath', '') });
  return Promise.all([
    snapshotCore('ayatori', sidecar, config.get('ayatoriInputPath', '')),
    snapshotCore('tsumugi', sidecar, config.get('tsumugiInputPath', '')),
  ]);
}

async function render(webview) {
  const nonce = crypto.randomBytes(16).toString('hex');
  webview.html = buildHtml(configuration().get('language', 'en'), await snapshots(), nonce);
}

class RuntimeViewProvider {
  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.onDidReceiveMessage(message => message?.type === 'refresh' && render(view.webview));
    render(view.webview);
  }
  refresh() { if (this.view) return render(this.view.webview); }
}

function activate(context) {
  const provider = new RuntimeViewProvider();
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('ayatsumugi.sidebar', provider));
  context.subscriptions.push(vscode.commands.registerCommand('ayatsumugi.refresh', () => provider.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand('ayatsumugi.open', async () => {
    const panel = vscode.window.createWebviewPanel('ayatsumugi.panel', 'Ayatsumugi', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.onDidReceiveMessage(message => message?.type === 'refresh' && render(panel.webview));
    await render(panel.webview);
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('ayatsumugi')) provider.refresh();
  }));
}

function deactivate() {}
module.exports = { activate, deactivate };
