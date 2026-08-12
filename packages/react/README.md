# @ayatsumugi/react

Public React UI for Ayatsumugi protocol envelopes. It renders React DOM, component,
state, query, and mutation nodes with draggable side panes, selectable details, and a
center-only maximized mode. English is the default; pass `language="ja"` for Japanese.

The package has no private core logic and does not bundle React. Call
`createAyatsumugiReact(React)` and import `@ayatsumugi/react/styles.css`.

```js
import React from 'react';
import { createAyatsumugiReact } from '@ayatsumugi/react';
import '@ayatsumugi/react/styles.css';

const { AyatsumugiExplorer } = createAyatsumugiReact(React);

export function RuntimeMap({ snapshots }) {
  return <AyatsumugiExplorer snapshots={snapshots} language="en" />;
}
```

Use `language="ja"` for Japanese. The two separators resize the left/right panes, and
“Maximize center” hides both side panes until restored.
