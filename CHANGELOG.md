# Changelog

Versioning policy (1.x and later):

- **major** — incompatible changes to documented public exports, supported
  syntax, the `mintlifyContainer` contract, or documented `ink-*` class names.
- **minor** — backwards-compatible features, syntax additions, and components.
- **patch** — bug fixes, documentation, and internal improvements.

Additional warnings and compatible CSS adjustments do not require a major
version. Undocumented behavior and exact serialized HTML are not compatibility
contracts. Before 1.0.0, minor releases could include breaking changes.

Use a version range such as `^1.0.0` for compatible releases, or `~1.0.0`
for patch updates only, rather than a commit SHA.

## Unreleased

- Fix: ` ```tree ` fences now nest a plain indented list by its indentation
  (any consistent width, or tabs). Previously every indented line became a
  root entry, so the hierarchy was lost and folders rendered empty. Slash
  paths and `tree`-command output are unchanged.

## 1.0.0

- First stable release of the Markdown engine, React renderer, and CLI.
  Documented public exports and supported syntax now follow semantic versioning.
- Add `Frame` for images, diagrams, code, and supported components, with an
  inline Markdown caption and a plain-text hint. Search text includes both.
- Support complete multiline opening tags for known block components, including
  self-closing and opt-in Generative UI tags. Preserve code/math examples,
  tab-indented code, and nested list/blockquote boundaries.
- Refresh English/Japanese guides and the example site for syntax profiles,
  sandboxed HTML embeds, Generative UI inputs/forms, and streaming controls.
  The playground can compare `all`, `zenn`, and `basic` using the same source.
- Retain the existing default `all` pipeline. Zenn-specific behavior uses
  `syntax="zenn"`; Generative UI remains a separate opt-in for `all`.

## 0.14.0

- Add React `html-embed` fences for filtered HTML, inline CSS, and SVG in a
  sandboxed iframe. Support `all` and `zenn`, theme-specific styles, and a
  50 KiB UTF-8 source limit. Scripts, navigation, and forms are blocked.
  The `basic` profile and core/CLI output retain literal code.

## 0.13.1

- Fix: show the filename in the header of `diff:filename` code fences.
  An optional language in the fence metadata remains supported.

## 0.13.0

- Add opt-in `syntax: 'zenn' | 'basic' | 'all'` profiles to React, normalization,
  plugin construction, and text extraction. The default remains the existing
  all-features pipeline. CLI commands accept `--syntax=`.
- The Zenn profile enables standard Markdown, GFM, math, native directives,
  inline footnotes, provider embeds, comments, and line breaks while leaving
  Mintlify tags and Inkstream-specific component fences unexpanded.
- Add Zenn provider embeds for YouTube, X, Gist, CodePen, SlideShare,
  SpeakerDeck, Docswell, JSFiddle, CodeSandbox, StackBlitz, Figma, and blueprintUE.
  Provider URL generation is tested; availability of external content depends
  on the provider. Gist content is fetched from the public GitHub API.
- Match single-line GitHub anchors and documented Mermaid size limits in the
  Zenn profile. Keep literal code samples and explicit angle autolinks intact.

## 0.12.0

- Fix: preserve GFM task-list checkboxes and their checked state in React,
  with Generative UI enabled or disabled. Native task inputs no longer
  pass through the Generative UI text-input renderer.

- Feature: `expandable` code fences show a 12-line preview with accessible
  Show more/Show less controls. Copy and text extraction retain the full
  source; titles, numbering, highlighting, diffs and wrapping are preserved.

- Feature: code-fence `title`, `lines`, and `highlight` presentation options
  in React, including SSR. Explicit titles also name CodeGroup tabs;
  legacy filenames, diff colors, wrapping, and copying remain supported.

- Feature: interactive Tabs and CodeGroup with keyboard navigation, accessible
  panels, and title synchronization (`sync="false"` opts out). Each panel isolates nested
  synchronization; named panels retain selection and state across reordering.
  Inactive panel fields are excluded from Form submissions, and non-panel
  content keeps its source order.

- Feature: enable inline `$...$`, display `$$` math, and `math` fences by
  default using remark-math and KaTeX. React SSR and CLI HTML include
  HTML + MathML; existing styles include matching CSS and local fonts.
- API: export `inkstreamRehypePlugins` for use after `remark-rehype`.
  Text extraction retains TeX, and math heading anchors match the TOC.
- Compatibility: paired dollar symbols can now denote math. Escape
  literal currency as `\$`. Invalid formulas stay visible with diagnostics.

## 0.11.0

- Performance: memoize normalized Markdown and skip parsing when only UI
  state or rendering context changes. Add optional `streamingUpdateInterval`
  to coalesce generated-source updates; completion immediately shows the
  final source. Defaults to 0 (immediate updates).

- Feature: add opt-in `streamingMode="block"`. During generation, explicitly
  completed UI with completed descendants and ancestors can be operated;
  EOF-recovered and mismatched tag structures remain disabled. The default
  document mode retains whole-response gating. No incremental parsing is added.

- Fix: reset Generative UI input DOM when its field ID changes, and reset
  Form descendants when the Form ID changes. Inserting or replacing fields
  cannot transfer uncontrolled values to a different ID. Reordered fields
  may reset to their defaults; append-only updates retain existing behavior.

## 0.10.0

- Feature: add `streaming` to `InkstreamMarkdown`. While true, default
  Generative UI inputs and buttons are disabled and action/change/submit
  notifications are suppressed. Defaults to false; parsing is unchanged.

## 0.9.0

- Feature: add opt-in `Form` and `Button type="submit"`, reporting typed
  snapshots of displayed input values to the application. Native navigation
  is prevented; nested forms are hidden and duplicate field IDs reject submission.
  Consumers exhaustively switching on GenerativeUiEvent must handle `submit`.

- Feature: add opt-in single-line text `Input`, with string change events,
  optional application-controlled values, and accessible labels.

- Feature: add opt-in Generative UI `Button`, `Slider`, `Checkbox`, and
  `Select` components. `InkstreamMarkdown` reports action and typed
  value-change events to application handlers; generated event handlers are
  never executed. Includes a static app-integration demo with a local action
  allowlist.

## 0.8.0

- Fix: clock times such as `09:12` and `10:00` remain text instead of being
  consumed as inline directives. This applies to regular Markdown and
  Generative UI content.
- Feature: opt-in static Generative UI tags (`Box`, `Row`, `Column`, and
  `Icon`), with existing `Card` and `Badge` renderers reused. Enable the
  profile with `generativeUi` on `InkstreamMarkdown`, or use the matching
  normalizer and remark plugin exports in a custom pipeline. The default
  Mintlify tag set remains unchanged.
- Style: Mintlify-style `Steps` now use numbered circular markers connected
  by a vertical line.
- Docs: add a prompt, OpenAI Responses API `curl` request, and rendered output
  example for generating Inkstream UI with GPT.

## 0.7.3

- Security: `<Card href>` values now use the shared safe URL policy. Unsafe
  values are omitted from the parsed attributes and rendered output, and
  produce a diagnostic instead of reaching HTML or custom renderers.

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
