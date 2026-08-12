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
                        └─ MCP sidecar          ├─ VS Code
                                                ├─ Zed
                                                ├─ SDK
                                                └─ React adapter
```

## Status

- VS Code: public shell implemented; English is the default, Japanese can be selected.
- Zed: real extension scaffold for launching the Ayatsumugi MCP sidecar, plus task-based
  report commands because Zed does not currently expose arbitrary extension webviews.
- SDK: public envelope validation and disconnected-state helpers are implemented.
- React adapter: reserved as a public package boundary; it remains private-to-publish until
  the Wasm ABI is finalized.
- Core adapters: the public contract is defined, but signed distributable core binaries
  still need to implement it.

## Development

```sh
npm install
npm test
```

See [architecture](docs/architecture.md) and the [security boundary](docs/security-boundary.md).
