# Ayatsumugi for Orca

An Orca Plugin API v1 panel that maps Ayatori/Tsumugi snapshots to the focused worktree terminal. It requests only `workspace:read`, `terminal:send`, notifications, and event subscription capabilities. Runtime data remains local.

The repository root contains `orca-plugin.json` and `orca-marketplace.json`, so Orca can install the plugin directly from the unified `nkwork9999/ayatsumugi` repository. The implementation remains in this directory; there is no separate Orca source repository.
