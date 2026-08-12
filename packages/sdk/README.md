# @noobknotsdev/ayatsumugi-sdk

Public, implementation-neutral helpers for protocol version 1. This package contains no
analysis engine, React/Fiber traversal, state graph implementation, or private binary.

```js
const { instantiateTsumugiWasm, createSnapshotStore } = require('@noobknotsdev/ayatsumugi-sdk');

const response = await fetch('/private-assets/tsumugi-core.wasm');
const core = await instantiateTsumugiWasm(response);
const handle = core.createStore();
const count = core.sourceInt(handle, 0);
core.setInt(handle, count, 1);

const store = createSnapshotStore([core.snapshot(handle)]);
store.subscribe(() => console.log(store.getSnapshot()));
```

Call `core.disposeStore(handle)` when the store is no longer needed. The Wasm stays local;
the SDK does not call a cloud API.
