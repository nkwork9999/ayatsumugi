# Ghostty and cmux

Both use the public terminal package; no patched terminal binary is required.

```sh
alias aya='npx --yes @noobknotsdev/ayatsumugi-terminal'
aya doctor
aya snapshot --source ayatori --input "$PWD/trace.jsonl"
aya html --source tsumugi --input "$PWD/snapshot.json" --output /tmp/ayatsumugi.html
```

Host detection recognizes `TERM_PROGRAM=ghostty`, `CMUX_SOCKET`, Herdr, and Orca environment markers. All analysis is performed by the separately distributed local sidecar.
