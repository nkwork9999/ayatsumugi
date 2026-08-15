# Ayatsumugi

Ayatsumugi is the open-source client repository for two private runtimes:

- **Ayatori Core** observes React DOM, Fiber, and state flow and diagnoses structural anomalies.
- **Tsumugi DevTools Core** exposes Tsumugi nodes, queries, mutations, and runtime transitions.

The implementations live together in one private `ayatsumugi-core` repository, but remain
separate components and release artifacts. This repository merges only their versioned
output envelopes and presents one user experience in VS Code and Zed.

## Repository boundary

This repository is licensed under Apache-2.0. It contains editor integrations, the public
wire schema, icons, and UI code. It does **not** contain either core, analysis rules,
React/Fiber extraction logic, calibration data, or private fixtures. Core binaries are
distributed separately under their own commercial terms.

```text
private ayatsumugi-core/
  ├─ Ayatori Core ──────┐
  └─ Tsumugi Core ──────┼─ versioned protocol ─ public ayatsumugi/
                        └─ MCP sidecar          ├─ VS Code / Zed
                                                ├─ Herdr / Orca
                                                ├─ Ghostty / cmux
                                                ├─ SDK / terminal CLI
                                                └─ React adapter
```

## Status

- VS Code: unified DOM/state view, draggable panes, center focus, and English/Japanese UI.
- Zed: MCP sidecar integration and local snapshot tasks.
- SDK: envelope validation, snapshot store, and the stable Tsumugi Wasm ABI client.
- React: publishable protocol UI with DOM/state nodes, details, edges, draggable panes,
  and center-only maximization. English is the default; Japanese is selectable.
- Terminals: one local-only npm CLI for Ghostty, cmux, Herdr, and Orca, plus native
  Herdr and Orca plugin manifests and panels.
- Private distribution: one local MCP sidecar, one native Ayatori analyzer, and one
  Tsumugi WasmGC module. No cloud API is required.

## Local use

Place the separately licensed `ayatsumugi-mcp-*` and `ayatori-core-*` files in the same
directory and keep their generated names unchanged. The sidecar discovers Ayatori beside
itself; `AYATORI_CLI` is only needed for a custom location.

```sh
./ayatsumugi-mcp-darwin-arm64 version --json
./ayatsumugi-mcp-darwin-arm64 snapshot --source ayatori --input /absolute/trace.jsonl
./ayatsumugi-mcp-darwin-arm64 snapshot --source tsumugi --input /absolute/snapshot.json
./ayatsumugi-mcp-darwin-arm64 serve --stdio
```

In VS Code, set `ayatsumugi.sidecarPath`, `ayatsumugi.ayatoriInputPath`, and
`ayatsumugi.tsumugiInputPath`. The Zed extension finds `ayatsumugi-mcp` on `PATH`.

## Development

```sh
npm install
npm test
```

See [architecture](docs/architecture.md), the [security boundary](docs/security-boundary.md),
and the [numbered verification checklist](docs/verification-checklist.md).
