# Syntax support

inkstream defines its own **Mintlify-style** syntax. It is *not* a
Mintlify- or MDX-compatible parser: tags are paired by a line-based
normalizer plus a tree pass over `html` nodes, not by an MDX/JSX parser.
Anything not listed as supported below should be treated as undefined
behavior, even if it happens to render today.

Status values:

| Status | Meaning |
| --- | --- |
| **supported** | Works, covered by tests, changes are breaking (see [CHANGELOG](../CHANGELOG.md)) |
| **partial** | Works in some forms; the limits are listed in Notes |
| **unsupported** | Does not work. Output is the literal source, usually with a vfile warning |

Results below were checked against the default pipeline
(`normalizeInkstreamMarkdown` + `inkstreamRemarkPlugins`) as of v0.5.0.

## Markdown base

| Syntax | Status | Notes |
| --- | --- | --- |
| CommonMark | supported | via `remark-parse` |
| GFM (tables, task lists, strikethrough, autolinks) | supported | via `remark-gfm`; strikethrough needs `~~`, single `~` is not strikethrough |
| Explicit heading id `## Title {#custom-id}` | supported | applied by the React heading renderer; the core pipeline (and `inkstream render`) leaves `{#id}` in the text |
| Wikilinks `[[path]]`, `[[path\|label]]` | partial | only when a resolver is supplied (`resolveWikilink`); otherwise literal text |

## Callouts

All four syntaxes normalize onto the same `aside.msg` output.

| Syntax | Status | Notes |
| --- | --- | --- |
| Mintlify `<Note>` `<Tip>` `<Info>` `<Warning>` `<Check>` | supported | block, single-line (`<Note>text</Note>`), and nested |
| Zenn `:::message` / `:::message alert` | supported | |
| Zenn `:::details Title` | supported | renders `<details>` |
| GitHub alerts `> [!NOTE]` `[!TIP]` `[!IMPORTANT]` `[!WARNING]` `[!CAUTION]` | supported | `WARNING` and `CAUTION` share the `alert` variant |

## Mintlify-style components

Block tags: `Card`, `CardGroup`, `Columns`, `Tabs`, `Tab`, `Accordion`,
`AccordionGroup`, `Expandable`, `Steps`, `Step`, `ResponseField`, `ParamField`,
`CodeGroup`, `Update`, `Tree` (plus the callouts above). Inline tags:
`Badge`, `Tooltip`. The tag and attribute names are the closed lists in the
`advanced` export (`MINTLIFY_*`).

| Syntax | Status | Notes |
| --- | --- | --- |
| Block tags, open and close on their own lines | supported | nesting depth is unlimited |
| Single-line block tag `<Card>text</Card>` | supported | whole line must be one paired tag |
| Self-closing `<Card title="a" />` | supported | |
| Inline `Badge` / `Tooltip` mid-sentence | supported | |
| Attributes as `name="value"` | supported | names must be in the attribute allowlist to reach `hProperties`; the full map stays on the node |
| Array attribute `tags={["A", "B"]}` | supported | flattened to `tags="A,B"` |
| Character references in quoted values (`&#x22;`, `&quot;`) | supported | decoded once; brace string literals `{"..."}` are not decoded |
| `<Expandable title="..." defaultOpen>` | supported | renders a `<details>` disclosure; nestable, e.g. inside `ParamField` |
| Other JSX expression attributes `title={"x"}` | unsupported | tag is not recognized; closing tag warns "Unmatched closing tag" |
| Multi-line open tag (attributes spread over lines) | unsupported | tag is not recognized; closing tag warns |
| `>` inside a quoted attribute value (`type="map<string, X>"`) | supported | quote-aware matching; single-line tags only |
| Unknown tag names (`<Foo>`) | unsupported | passed through as raw HTML; warns |
| Unclosed tag | supported | auto-closes at the end of its parent; warns "was never closed" |
| Unmatched closing tag | supported | stays literal; warns |
| Tag inside a blockquote, with blank `>` lines around it | supported | |
| Tag inside a blockquote, no blank lines (`> <Note>` / `> text`) | unsupported | left as raw HTML; warns |
| Tag inside a list item | supported | indent the tag to the item's content column, with a blank line before it; the block (including fences inside `Tab`/`Step`) stays in the item |
| `<Tree><Tree.Folder>…</Tree>` | supported | becomes the same node as the ` ```tree ` fence |
| MDX: `import`/`export`, `{expressions}`, `{/* comments */}`, JSX fragments | unsupported | literal text |
| Per-component attribute schemas | unsupported | one global allowlist; planned |

## HTML subset

Raw HTML is never enabled. A small allowlist of HTML forms is converted to
safe nodes instead; everything else stays literal text.

| Syntax | Status | Notes |
| --- | --- | --- |
| Empty anchor `<a id="x" />`, `<a id="x"></a>`, `<a name="x"></a>` | supported | renders `<span id="x">` as a `[link](#x)` target; consecutive anchor lines work; only a bare `id`/`name` with a safe value (no whitespace, quotes, `<>&=`) is accepted |
| `<h1>`–`<h6>` headings, single or multi-line, with optional `id` | supported | rewritten to `## Text {#id}`, so rendering, `extractMarkdownHeadings`, and duplicate-id numbering all agree; text is read as inline Markdown; `class`, `style`, event handlers and other attributes are dropped; an id outside the `{#id}` character set is ignored (slug used); a heading that is not one clean tag (trailing text, no close, blank line inside) stays literal |
| `<a href="...">label</a>`, inline or standalone, optional `title` / `target="_blank"` | supported | becomes a Markdown link, so it uses the app's custom `a` renderer; the label is inline Markdown; `href` must be http(s), `mailto:`, relative, or a `#fragment` (`javascript:`, `data:`, `tel:` etc. stay literal); `target="_blank"` always gets `rel="noopener noreferrer"`; `class`/`className`, `style`, `id`, event handlers and other attributes are dropped; JSX `href={...}` is not evaluated; needs a matching `</a>` and no nested `<a>` |
| `<a id="x" href="...">` with an empty label | unsupported | left as literal text |
| `<img src="..." alt="..." width="100" height="56" />` (or without the `/`) | supported | becomes a Markdown image, so it uses the app's custom `img` renderer; `src` must be http(s) or relative (`javascript:`, `data:`, `ftp:` etc. stay literal); `width`/`height` are kept only as positive integers; `alt` and `title` are read; `class`/`className`, `style`, `srcset`, `loading`, `data-*`, event handlers and other attributes are dropped; JSX `src={...}` is not evaluated; works inline, standalone, and inside links | left as literal text; not a bare target |

## Fenced components

| Fence | Status | Notes |
| --- | --- | --- |
| ` ```tree ` | supported | slash paths or `tree`-command output; malformed input warns and stays a code block |
| ` ```quiz ` | supported | `question:`, `A:`/`B:`/…, `correct:`, optional `hint:`/`explanation:`; malformed input warns and stays a code block |
| ` ```chart:bar `, ` ```chart:radar ` | supported | `label: value` lines; malformed input warns and stays a code block |
| ` ```mermaid ` | supported | rendered by the React layer (optional peer dependency) |
| ` ```lang:filename `, ` ```diff lang:filename ` | supported | code meta reaches the `code` renderer as `metastring` |

## Zenn extensions

| Syntax | Status | Notes |
| --- | --- | --- |
| `![alt](url =250x)` | supported | size is encoded into the URL query; read back with `parseImageMetadata` |
| `*caption*` line under an image | supported | |
| `@[card](url)`, `@[github](url)` | supported | reduced to a bare URL line, then handled as an embed |
| Other Zenn embeds (`@[youtube]`, `@[tweet]`, …) | unsupported | not recognized; parsed as an ordinary markdown link |

## Embeds from standalone URLs

A URL alone on its own line becomes an embed.

| URL | Status | Notes |
| --- | --- | --- |
| YouTube | supported | |
| GitHub file (`https://github.com/o/r/blob/branch/path#L1-L9`) | supported | fetched in the browser from `raw.githubusercontent.com` |
| Any other `http(s)` URL | partial | link card; OGP metadata only when the app supplies `ogpEndpoint`, otherwise URL-only |

## Diagnostics

Problems are reported as vfile messages (`file.messages`) and never thrown:
unmatched/unclosed tags, capitalized tags left as raw HTML (unknown
component names, or known ones that could not be paired), and malformed
tree/quiz/chart fences. A fuzz test
(`tests/fuzz.test.ts`) asserts that arbitrary input does not throw.

## Changing this table

A row moving from *unsupported* to *supported* is a feature (minor or
patch). A *supported* row changing behavior is breaking. See the
versioning policy in [CHANGELOG.md](../CHANGELOG.md).
