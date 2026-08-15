export default function activate(orca) {
  orca.commands.register('open', async (args) => {
    const context = await orca.host.call('workspace.readContext', {});
    const terminalId = args?.terminalId || context?.terminals?.[0]?.id;
    if (!terminalId) return { ok: false, reason: 'No terminal is available in the focused worktree.' };
    const source = args?.source === 'tsumugi' ? 'tsumugi' : 'ayatori';
    const input = String(args?.input || '');
    if (!input) return { ok: false, reason: 'An absolute input path is required.' };
    const quotedInput = `'${input.replaceAll("'", `'\"'\"'`)}'`;
    return orca.host.call('terminal.sendText', {
      terminalId,
      text: `npx --yes @noobknotsdev/ayatsumugi-terminal snapshot --source ${source} --input ${quotedInput}`,
      enter: true,
    });
  });
  orca.events.on('agent.status.changed', payload => orca.log(`Ayatsumugi observed agent ${payload.state}`));
}
