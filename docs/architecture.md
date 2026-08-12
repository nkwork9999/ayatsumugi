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

Core commands planned by the public shell:

```text
<core> version --json
<core> snapshot --format ayatsumugi-v1
<core> report --format ayatsumugi-v1 --output <path>
```

The two core implementations may use different MoonBit targets and internal models.
Ayatori is expected to ship primarily as native executables. Tsumugi is expected to ship
as Wasm for browser consumers, with an optional native analyzer for editor workflows.

## Repository dependency direction

```text
ayatsumugi-core (private) ──depends on──> ayatsumugi protocol/SDK (public)
ayatsumugi (public)       ──runs────────> signed binary artifacts only
```

The public CI must never clone the private repository. Private release automation may
publish separately licensed artifacts, checksums, and signatures to a public distribution
channel.
