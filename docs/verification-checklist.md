# Numbered verification checklist

Keep these identifiers stable when recording a release result.

- [x] **1. Public/private boundary** — public boundary scan and private secret scan.
- [x] **2. Ayatori engine** — Wasm, WasmGC, JavaScript, native, observer, and tools suites.
- [x] **3. Tsumugi engine** — JavaScript and WasmGC suites plus ABI smoke test.
- [x] **4. Product integrations** — MCP lifecycle, Ayatori/Tsumugi snapshots, SDK,
  React visualization, VS Code, and Zed build checks.
- [x] **5. Release security** — race/vet, stripped artifacts, path/source rejection,
  checksums, signatures, and bundled-core execution.
- [x] **6. Commit readiness** — clean diff check, package dry runs, ignored artifact check,
  and scoped commits in both repositories.

Items 1–5 are automated by the two repositories' test/release scripts. Item 6 remains a
human-confirmed publication boundary: inspect the staged file list before pushing or
publishing. A production macOS release also supplies `AYATSUMUGI_CODESIGN_IDENTITY` so
the local ad-hoc signature is replaced with a Developer ID signature and timestamp.
