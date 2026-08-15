# @noobknotsdev/ayatsumugi-terminal

Local-only terminal adapter for Ghostty, cmux, Herdr, Orca, and ordinary shells. It invokes the separately licensed `ayatsumugi-mcp` binary and never uploads runtime data.

```sh
npx @noobknotsdev/ayatsumugi-terminal doctor
npx @noobknotsdev/ayatsumugi-terminal snapshot --source ayatori --input /absolute/trace.jsonl
npx @noobknotsdev/ayatsumugi-terminal html --source tsumugi --input /absolute/snapshot.json --output ayatsumugi.html
```

Set `AYATSUMUGI_MCP_BIN` when the sidecar is not on `PATH`.
