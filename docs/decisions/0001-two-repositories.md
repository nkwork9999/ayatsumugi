# 0001: Public clients and private core

Status: accepted locally on 2026-08-12.

Ayatsumugi uses two repositories:

- `ayatsumugi`: Apache-2.0 clients, editor extensions, protocol, SDK, docs, and UI.
- `ayatsumugi-core`: private MoonBit sources, fixtures, rules, build tooling, and release
  signing configuration.

Ayatori and Tsumugi share the private repository but do not become one implementation.
Their public identities are carried in the protocol `source` field and their artifacts can
be versioned independently.

The public repository never receives private source, source maps, symbols, or signing keys.
Binary artifacts use a separate proprietary license even when downloaded by an Apache-2.0
client.
