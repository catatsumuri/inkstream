# inkstream2 (draft)

Draft rewrite of the inkstream markdown engine. v1 converts Mintlify-style
JSX tags to colon-fence directives with a ~1,850-line line-based string
preprocessor; v2 builds the same structure directly on the mdast tree.

## Pipeline

1. `normalizeMintlifyBlocks(markdown)` — line-based pre-pass that surrounds
   standalone tag lines with blank lines (skipping code fences) so remark
   parses each tag as its own `html` flow node, strips the authoring
   indentation inside open tags (up to the open tag's indent + 4, mirroring
   v1) so indented tag bodies don't become indented code blocks, and
   flattens JSX array attributes (`tags={["A", "B"]}` → `tags="A,B"`), which
   would otherwise make the tag invalid HTML for remark.
2. `remark-parse` — standard markdown parsing.
3. `remarkMintlifyTags` — pairs open/close `html` nodes with a stack (once
   for each parent's flow children, once for each paragraph's phrasing
   children) and lifts the nodes between a pair into a `mintlifyContainer`
   node carrying `name`, `attributes`, and `data.hName`/`hProperties` for
   remark-rehype. Block tag names (`Note`, `Card`, `Steps`, ...) pair at
   flow level or as a whole single-line paragraph; inline tag names
   (`Badge`, `Tooltip`) pair mid-paragraph without disturbing surrounding
   text.
4. `remarkCodeFenceComponents` — converts ` ```tree `, ` ```quiz `, and
   ` ```chart:bar `/` ```chart:radar ` fenced code blocks into
   `mintlifyContainer` nodes carrying the parsed structure as one
   JSON-string property (`tree`, `quiz`, `chart`) for a renderer component
   to read. Malformed fences emit a vfile warning and are left as plain
   code blocks.
5. `normalizeZennDirectiveShorthand(markdown)` (run before step 1, alongside
   `normalizeMintlifyBlocks`) + `remark-directive` + `remarkZennDirective` —
   support for the native `:::message` / `:::details` authoring syntax an
   author can write directly (as opposed to the Mintlify JSX tags, which v2
   never routes through colon-fences at all). The shorthand normalizer
   rewrites the friendly `:::message alert` / `:::details タイトル` forms
   into the `{.class}` / `[label]` syntax `remark-directive` requires;
   `remarkZennDirective` then reads the resulting `containerDirective` nodes
   remark-directive produces. This is the one piece of the pipeline that
   still needs a third-party directive parser, since colon-fence syntax
   itself isn't something a tag-pairing plugin over `html` nodes can parse.
   Like v1, the normalizer protects code fences *and* inline code spans, so
   literal `` `:::message alert` `` examples in prose survive; it also
   reduces Zenn's `@[card](url)` / `@[github](url)` embeds to bare URL
   lines for a linkify-style renderer to pick up.
6. `remarkGithubAlerts` — normalizes GitHub blockquote alerts (`> [!NOTE]`
   etc.) onto the same `aside.msg` contract as the Mintlify callouts and
   `:::message`.
7. `remarkTreeTags` — converts a paired JSX `<Tree><Tree.Folder>…</Tree>`
   block (captured by `remarkMintlifyTags`) into the same JSON-carrying
   `tree` node the ` ```tree ` fence produces.
8. `normalizeZennImages(markdown)` + `parseImageMetadata(url)` — Zenn's
   image sizing/caption syntax (`![](url =250x)`, a `*caption*` line under
   the image). The sizing suffix lives inside the markdown image
   destination, where remark's parser refuses spaces, so this stays a
   line-based step that encodes the metadata into query parameters; an
   image renderer reads them back with `parseImageMetadata`.

## Drop-in React renderer (`@catatsumuri/inkstream2/react`)

The core package stays React-free; the `/react` subpath ships everything a
React app needs to render inkstream markdown in one line:

```tsx
import { InkstreamMarkdown } from '@catatsumuri/inkstream2/react';

<InkstreamMarkdown>{markdownSource}</InkstreamMarkdown>;
```

- `InkstreamMarkdown` — wraps react-markdown with the full plugin chain and
  the string-level normalizers already wired in the correct order.
- `inkstreamDefaultComponents` — default renderers for every custom element
  (callouts, cards, steps, tabs, accordions, badges, tooltips, images,
  updates, API fields, tree, quiz, chart). They carry stable `ink-*` class
  names and no visual opinions: style them with plain CSS, or replace
  individual renderers via the `components` prop.
- `inkstreamRemarkPlugins` / `normalizeInkstreamMarkdown` — the ordered
  plugin array and composed preprocessing chain, also exported from the
  core entry point for non-React pipelines (the golden corpus renderer
  uses the same exports).

`react` and `react-markdown` are optional peer dependencies — consumers
that only use the core entry point never need them.

## What the AST approach fixes structurally

- **No nesting limit** — v1 encoded depth in colon-fence length (7 levels
  max, `10 − depth` colons); v2 nesting is just tree structure.
- **Single-line tags** — `<Note>text</Note>` in one paragraph works.
- **Self-closing tags** — `<Card title="..." />`.
- **Inline tags** — `<Badge>` / `<Tooltip>` pair mid-sentence.
- **Error tolerance with diagnostics** — unmatched close tags stay literal,
  unclosed tags auto-close at end of parent, and both emit vfile warnings
  instead of failing silently. Malformed tree/quiz/chart fences fall back
  to a plain code block with a warning instead of silently dropping data.
- **No redundant raw-JSON dump** — v1's tree/quiz/chart directives leave
  the source fence's `code` child in the tree *alongside* the JSON
  attribute, so the raw JSON also renders as a visible `<pre><code>` block.
  v2's `mintlifyContainer` has no children for these, so only the intended
  component renders.

## Not in this draft (planned)

- Per-component attribute schemas (draft reuses the v1 global allowlist for
  `hProperties`; the full parsed attribute map is kept on the node).
- Tags inside blockquotes/lists currently require blank lines around them
  (the normalizer only handles top-level tag lines); fixing this means
  splitting multi-line `html` nodes or normalizing per container.
- Multi-line JSX open tags (an open tag with attributes spread across
  several lines; v1 joins them in `joinMultilineJsxTags`).
- Attribute naming convention: v1 prefixes hProperties with
  `data-<component>-<attr>` (e.g. `data-card-href`), presumably because its
  output was raw custom HTML elements read via `dataset`. v2 intentionally
  uses raw names (`href`) since containers render through React components
  that read props directly — this is a deliberate v2 API change, not a gap
  to close.
- Packaging, lint/format/CI.

## Golden corpus (`golden/`)

Snapshot regression suite: renders every `golden/corpus/*.md` fixture
through the full pipeline and compares the prettified HTML against the
committed baseline in `golden/baseline/*.html`.

```sh
npm run golden             # check; exits non-zero on any diff
npm run golden -- --update # re-render and accept the current output
```

- `golden/render-v2.ts` — the pipeline under test
  (`normalizeInkstreamMarkdown` → `inkstreamRemarkPlugins` →
  `remark-rehype` → `hast-util-to-html`), the same exports consumers use.
- `golden/diff.ts` — prettifies output to one tag per line, line-diffs it
  against the baseline, and writes the current output to
  `golden/output/*.html` (gitignored) for inspection.

Fixtures `01`–`09` are synthetic; `10`–`14` are the five real syntax-guide
documents from thinkstream's `SyntaxSeeder` (basic markdown, extended
markdown/GFM, Zenn syntax, Mintlify syntax, thinkstream syntax) — a far
truer signal, and the corpus that surfaced the fence-state, inline-code,
indentation, and array-attribute bugs the current pipeline fixes.

The corpus originally drove a v1-vs-v2 comparison (rendering the same
fixtures through inkstream v1's directive pipeline); once every difference
was either fixed or decided as an intentional v2 change, the v1 renderer
and its `file:` dependency were dropped and the v2 output became the
baseline.
