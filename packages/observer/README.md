# @noobknotsdev/ayatsumugi-observer

Development-only browser observer for the local Ayatsumugi analyzer. Load the bundled
module before `react-dom`; it records React commits into `globalThis.__AYATORI__`.
Analysis rules remain in the separately distributed private native core.

```html
<script type="module" src="/ayatsumugi-observer.js"></script>
```

The observer performs no network requests. A host application may explicitly send
`__AYATORI__.dump()` to its own local development middleware.
