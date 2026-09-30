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

- CI/publish: `npm run smoke:ssr` loads the built package by its public name
  in plain Node (no DOM) and server-renders a document covering the
  browser-dependent renderers.
- Fix: a quoted attribute value containing `>` (`type="map<string, X>"`)
  no longer stops a tag from being recognized; `ParamField` /
  `ResponseField` with generic types now render.
- Fix: character references in quoted attribute values (`&#x22;`, `&quot;`)
  are decoded once instead of showing as literal text. Adds a
  `decode-named-character-reference` dependency.
- Feature: `<Expandable title="..." defaultOpen>` renders a `<details>`
  disclosure (`ink-expandable` classes), including nested fields. Adds the
  `defaultOpen` attribute name to the allowlist.

## 0.5.2

- Fix: a fence whose meta starts with a flag (` ```python expandable
  theme={null} `) lost syntax highlighting, because the flag overwrote the
  language read from the fence. Meta is now only used to infer a language
  when the fence declared none.

## 0.5.1

- Diagnostics: capitalized tags that stay raw HTML (unknown component names,
  or known tags the pairing pass could not handle, e.g. inside a blockquote
  without blank lines) now emit a vfile warning. Output is unchanged.
- Docs: `docs/syntax.md` support matrix, pinned by
  `tests/syntax-matrix.test.ts`.

## 0.5.0

### Breaking

- Root exports trimmed to the public API. Moved to
  `@catatsumuri/inkstream/advanced`: `normalizeMintlifyBlocks`,
  `normalizeZennDirectiveShorthand`, `normalizeZennImages`,
  `parseJsxAttributes`, `parseTreeTags`, `slugify`,
  `normalizeMarkdownHeadingText`, `createHeadingIdDispenser`, the manifest
  constants, and the individual plugins (`remarkMintlifyTags`,
  `remarkGithubAlerts`, `remarkTreeTags`, `remarkCodeFenceComponents`,
  `remarkCodeMeta`, `remarkZennDirective`, `remarkLinkifyToCard`).
  `inkstreamRemarkPlugins` and `normalizeInkstreamMarkdown` remain in root.

### Other

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
