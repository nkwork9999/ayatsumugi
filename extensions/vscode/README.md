# Ayatsumugi for VS Code

This public extension renders Ayatori DOM/Fiber observations and Tsumugi state in one
local view. It does not contain either private core.

1. Install the extension and the matching private native bundle.
2. Set `ayatsumugi.sidecarPath` to the absolute `ayatsumugi-mcp-*` path.
3. Set `ayatsumugi.ayatoriInputPath` to a trace and/or
   `ayatsumugi.tsumugiInputPath` to a state snapshot.
4. Run **Ayatsumugi: Open Unified View** or open **Runtime Map** in the activity bar.

English is the default. Set `ayatsumugi.language` to `ja` for Japanese. Drag either
separator to resize the side panes; use the header control to maximize the center graph.
