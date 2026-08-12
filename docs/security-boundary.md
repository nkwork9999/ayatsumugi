# Public/private security boundary

The following content must never enter this repository or its Git history:

- MoonBit core source (`*.mbt`, `moon.mod*`, `moon.pkg*`)
- Ayatori rules, Fiber traversal, scoring, calibration, and private traces
- Tsumugi graph/query implementation and private stress fixtures
- private signing keys, service credentials, source maps for proprietary bundles
- core binaries unless a release explicitly marks them as separately licensed

`npm run check:boundary` fails when obvious private-core artifacts appear. It is
only a guardrail; release review must also inspect the complete artifact list.

The public workflow must never check out a private core repository. Private core
workflows may publish signed binary assets into a public release, but the reverse
dependency is forbidden.

