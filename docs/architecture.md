# Architecture

Ayatsumugi is an integration shell, not a merged analysis engine.

```text
React application
  ├─ Ayatori observer/runtime ── Ayatori Core ───────┐
  └─ Tsumugi devtools bridge ── Tsumugi DevTools Core├─ Ayatsumugi envelope
                                                     └─ VS Code / Zed / browser
```

Both cores are developed in one private repository so shared release and security tooling
does not drift. Each core still owns its algorithms, persistence, artifact, and ABI. The
public repository owns only discovery, process isolation, protocol validation,
localization, presentation, and deliberately thin client adapters.

## Public contract

Both cores emit protocol version 1 envelopes. They remain distinguishable by
the `source` field. Ayatsumugi never guesses which core produced a node.

The implemented local command boundary is:

```text
ayatsumugi-mcp version --json
ayatsumugi-mcp snapshot --source ayatori --input <absolute-trace> --format ayatsumugi-v1
ayatsumugi-mcp snapshot --source tsumugi --input <absolute-snapshot> --format ayatsumugi-v1
ayatsumugi-mcp serve --stdio
```

The two core implementations use different MoonBit targets and internal models. Ayatori
ships as a stripped native analyzer next to the sidecar. Tsumugi ships as a stripped
WasmGC module for the public SDK. The sidecar only reads local files and uses stdio MCP;
it opens no network listener.

## Repository dependency direction

```text
ayatsumugi-core (private) ──depends on──> ayatsumugi protocol/SDK (public)
ayatsumugi (public)       ──runs────────> separately licensed binary artifacts only
```

The public CI must never clone the private repository. Private release automation may
publish separately licensed artifacts, checksums, and signatures to a public distribution
channel.
