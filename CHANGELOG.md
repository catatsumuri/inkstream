# Changelog

Versioning policy (0.x):

- **minor** (`0.x.0`) — breaking changes and new features.
- **patch** (`0.x.y`) — bug fixes, docs, tests, internal refactors. No change
  to the public API or rendered output.

"Breaking" covers exported names, the `mintlifyContainer` node shape, `ink-*`
class names, and the parse result of existing syntax. Adding syntax,
components, or warnings, and small CSS tweaks, are not breaking.

Consumers should pin a range such as `~0.4.0`, not a commit SHA.

## 0.7.2

- Fix: fenced code blocks inside list items retain their structural indentation,
  so code stays inside the item and subsequent items are not swallowed by a
  stray fence. Opening fences, content, and closing fences now lose the same
  authoring indentation; relative code indentation and fences inside Mintlify
  tags are preserved. Adds normalization and AST regression coverage.

## 0.7.1

- Fix: `lucide-react` is now a required peer dependency. It was marked
  optional, but the `/react` entry imports it eagerly (headings, code blocks,
  embeds, quizzes), so a project without it failed with
  `ERR_MODULE_NOT_FOUND` on `@catatsumuri/inkstream/react`. `mermaid`,
  `recharts` and `shiki` stay optional: they are only loaded on demand. A
  new test keeps the two in step.

## 0.7.0

- Feature: ordinary HTML images (`<img src alt width height>`) become
  Markdown images, so they render and use the app's custom `img` renderer.
  Only `src` (http/https/relative), `alt`, `title` and positive integer
  `width`/`height` are read; `javascript:`/`data:` sources, event handlers,
  `style`, `srcset` and JSX expressions are never honored. The default
  `img` renderer now also honors `width`/`height` props. Adds
  `remarkHtmlImages` to `inkstreamRemarkPlugins` and `/advanced`.
- Feature: ordinary HTML links (`<a href="...">label</a>`) become Markdown
  links, so they are clickable and use the app's custom `a` renderer. Only
  `href` (http/https/mailto/relative/fragment), `title` and
  `target="_blank"` (always with `rel="noopener noreferrer"`) are kept;
  `javascript:`/`data:` URLs, event handlers, `style`, and JSX expressions
  are never honored. Adds `remarkHtmlLinks` to `inkstreamRemarkPlugins`
  and `/advanced`.
- Feature: HTML headings (`<h1>`–`<h6>`, single or multi-line, optional `id`)
  become real headings. They are rewritten to `## Text {#id}` by the new
  `normalizeHtmlHeadings` (run first by `normalizeInkstreamMarkdown` and by
  `extractMarkdownHeadings`), so rendering, the table of contents, and
  duplicate-id numbering stay consistent. Only the level, the text, and a
  safe `id` are kept; other attributes are dropped.
- Feature: empty HTML anchors (`<a id="x" />`, `<a id="x"></a>`,
  `<a name="x"></a>`) become `<span id="x">` fragment targets, so
  `[link](#x)` works. Only a bare `id`/`name` with a safe value is accepted;
  raw HTML is not enabled. Adds `remarkHtmlAnchors` to
  `inkstreamRemarkPlugins` and to `/advanced`.
- Fix: a tag block inside a list item (`1. Install:` then an indented
  `<Tabs>` or `<Note>`) no longer ends the list. The normalizer flushed tag
  lines to column 0, which closed the list, so later items rendered as plain
  paragraphs and the block rendered outside the list.
- CLI fix: an unknown command no longer hangs waiting on stdin, and an
  unreadable input file prints `Cannot read input: ...` (exit 1) instead of
  a stack trace.
- Docs: Agent Skills for the CLI and the syntax (`skills/`).

## 0.6.0

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
