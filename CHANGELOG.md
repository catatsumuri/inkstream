# Changelog

Versioning policy (0.x):

- **minor** (`0.x.0`) — breaking changes and new features.
- **patch** (`0.x.y`) — bug fixes, docs, tests, internal refactors. No change
  to the public API or rendered output.

"Breaking" covers exported names, the `mintlifyContainer` node shape, `ink-*`
class names, and the parse result of existing syntax. Adding syntax,
components, or warnings, and small CSS tweaks, are not breaking.

Consumers should pin a range such as `~0.4.0`, not a commit SHA.

## Unreleased

- Docs: README install section and pipeline rewritten in execution order.
- Tests: added a fast-check fuzz test (the pipeline must never throw).

## 0.4.0

- Style `Columns`; render `Card` / `Accordion` `icon` as Lucide icons.

## 0.3.0

- Explicit heading IDs (`## Title {#custom-id}`).

## 0.2.0

- Upgrade Mermaid rendering to v12; Node support aligned to `>=22.12.0`.

## 0.1.3

- Lazy-load the chart renderer instead of importing recharts statically.

## 0.1.2

- Retry a failed GitHub embed fetch once before giving up.

## 0.1.1

- Restore vertical rhythm between top-level markdown blocks.

## 0.1.0

- First npm release (`@catatsumuri/inkstream`).
