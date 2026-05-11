// When T is void, the success branch carries no `data`; when T is non-void,
// `data` is required and non-optional so `if (r.ok) r.data` narrows cleanly
// without the caller needing to non-null-assert. The `[T] extends [void]`
// form prevents distribution over union types.
export type Result<T = void> =
  | ([T] extends [void] ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };
