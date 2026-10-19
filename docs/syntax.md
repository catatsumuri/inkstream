# Syntax support

[日本語版](syntax.ja.md)

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

Results below are checked against the default pipeline
(`normalizeInkstreamMarkdown` + `inkstreamRemarkPlugins`) by
`tests/syntax-matrix.test.ts`. For editable examples rendered by the React
component, see [`site/examples/`](../site/examples/) and the example site.

## Markdown base

| Syntax | Status | Notes |
| --- | --- | --- |
| CommonMark | supported | via `remark-parse` |
| GFM (tables, task lists, strikethrough, autolinks) | supported | via `remark-gfm`; strikethrough needs `~~`, single `~` is not strikethrough |
| Clock times such as `09:12` and `10:00` | supported | preserved as text even though `remark-directive` also recognizes colon-prefixed forms |
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
| Per-component attribute schemas in the default Mintlify profile | unsupported | one global allowlist; the opt-in Generative UI profile has a small fixed schema |

## Generative UI (opt-in)

The React renderer accepts `generativeUi` to enable a small component set. It
defaults to `false`, so these tags remain unsupported in the normal
pipeline. Custom pipelines can use `normalizeGenerativeUiMarkdown` with
`generativeUiRemarkPlugins`, or call `createInkstreamRemarkPlugins({
generativeUi: true })` alongside `normalizeInkstreamMarkdown(source, {
generativeUi: true })`.

| Tag | Attributes | Notes |
| --- | --- | --- |
| `Box` | `padding="0"` through `"8"` | spacing unit is 0.25rem |
| `Row`, `Column` | `align="start|center|end|stretch|baseline"`, `justify="start|center|end|between|around"`, `gap="0"` through `"8"` | enum values are validated; gap is 0–8 |
| `Icon` | `name` | safe lowercase icon name; unknown Lucide names render nothing |
| `Button` | `action`, `type` | emits an application event; action identifiers match `[a-z][a-z0-9._:-]{0,63}` |
| `Slider` | `id`, `label`, `min`, `max`, `step`, `default` | numeric range input; `id` keys optional application-controlled values |
| `Form` | `id`, `action` | submits a typed snapshot of displayed input values |
| `Input` | `id`, `label`, `default`, `placeholder` | single-line text input; change values are strings |
| `Checkbox` | `id`, `label`, `default` | boolean input; `default` is `"true"` or `"false"` |
| `Select` | `id`, `label`, `default` | string input; contains one or more `Option` tags |
| `Option` | `value` | one allowed Select choice; use a block tag with a value and label |
| Existing `Card`, `Badge` | existing attributes | reused without aliases |

Example:

```md
<Card title="Security review">
  <Row align="center" gap="3">
    <Icon name="shield-check" />
    <Badge color="green">Complete</Badge>
  </Row>
</Card>
```

Interactive example:

```md
<Slider id="threshold" label="Threshold" min="0" max="100" default="65" />

<Button action="refresh-report">Refresh report</Button>

<Checkbox id="include-archived" label="Include archived" default="false" />

<Select id="period" label="Period" default="week">
  <Option value="day">
    Daily
  </Option>

  <Option value="week">
    Weekly
  </Option>
</Select>
```

Pass `generativeUiValues={{ threshold: value, "include-archived": false, period: "week" }}` to control the inputs and `onGenerativeUiEvent` to receive `{ type: "change", id, value }` or `{ type: "action", action }`. Change values can be numbers (Slider), booleans (Checkbox), or strings (Select and Input). Update the values prop from application state when a controlled input changes. A button without an `action` is disabled.

Tables use GFM and charts use the existing chart fences. The interactive tags
do not execute generated JavaScript. `InkstreamMarkdown` accepts
`onGenerativeUiEvent` and `generativeUiValues` props; events are notifications
only, so the application must allowlist actions and perform its own
authorization. Unsupported attributes are dropped with a vfile diagnostic.

```xml
<Input id="query" label="検索条件" default="" placeholder="キーワード" />
```

`generativeUiValues.query` controls the input when it is a string, including an empty string. Missing or non-string values use uncontrolled mode; switching back resets to `default`. Changes emit `{ type: "change", id: "query", value: string }`.


### Form

```xml
<Form id="report-settings" action="apply-settings">
  <Input id="query" label="検索条件" />
  <Checkbox id="include-archived" label="過去の記録を含める" />
  <Button type="submit">適用</Button>
</Form>
```

Submission emits `{ type: "submit", id, action, values }`, including untouched defaults and unchecked checkboxes (`false`). Input and Select values are strings, Slider values are numbers, and Checkbox values are booleans. Exhaustive switches on the event union must add a `submit` branch.

Submission prevents native navigation and never executes generated code or uses the action identifier as a URL. The application validates values, authorizes operations, and performs API requests. Controls remain disabled until hydration completes. Duplicate field IDs within a Form reject submission; nested Forms are hidden; missing or invalid form IDs/actions disable controls. Hidden inputs are excluded; an empty form submits an empty object.

Ordinary Buttons retain action events. Submit Buttons use the enclosing Form action and are disabled outside a Form. Use document-wide unique input IDs; external values remain keyed by ID. Automatic collection supports default input renderers; inputs replaced through `components` are not guaranteed. Do not place Inkstream inside an application's existing HTML form.


### Streaming

```tsx
<InkstreamMarkdown generativeUi streaming={isGenerating} onGenerativeUiEvent={handleUiEvent}>
  {generatedMarkdown}
</InkstreamMarkdown>
```

`streaming` defaults to `false`. The application sets it to `true` when generation starts and `false` when generation completes. While true, default Button, Slider, Checkbox, Select, Input, and Form submission are disabled; action/change/submit notifications are suppressed without replay. Native Form navigation is still prevented. UI previews and external controlled-value updates continue.

Toggling this prop does not remount controls or reset their values. Focus preservation when disabling is not guaranteed. Ordinary links, Tabs, Accordion, and Quiz are unaffected. Applications must disable custom renderers and their independent side effects themselves; notifications through the existing callback are suppressed.

Completion is application-controlled: `false` does not validate syntax or authorize operations. Parsing, including unclosed-tag recovery, is unchanged. Block completion, incremental parsing, update throttling, and state preservation during insertion are not provided.

When a field ID changes at a rendered position, the input DOM is recreated so uncontrolled values cannot transfer to a different ID. Changing a Form ID also resets descendant state. Insertion or reordering can reset existing inputs to their defaults. Use unique IDs and application-controlled `generativeUiValues` to retain values; focus retention across DOM replacement is not guaranteed.


### Block completion

```tsx
<InkstreamMarkdown generativeUi streaming={isGenerating} streamingMode="block">
  {generatedMarkdown}
</InkstreamMarkdown>
```

`streamingMode` defaults to `"document"`, which waits for the whole response. In `"block"` mode, explicitly closed or self-closing UI can be operated while generation continues. Descendant tags and ancestor containers must also be complete. EOF recovery and mismatched-tag auto-closure do not count as completion. A closed Form inside an unclosed Card remains disabled.

Completed Forms can submit while later content is generating; applications must still validate actions/values and authorize operations. With `streaming=false`, existing fallback behavior applies. Completion checks supported tag pairing, not schema validity or Markdown-wide stability. Standalone self-closing inputs count as complete immediately.

Completion metadata is internal to the React AST pipeline; the normal Markdown pipeline and public AST shape remain unchanged. This does not freeze/cache completed ASTs or add incremental parsing: the whole source is still parsed on updates. Custom-renderer interactions and independent side effects remain application responsibilities.


### Streaming update interval

```tsx
<InkstreamMarkdown generativeUi streaming={isGenerating} streamingMode="block" streamingUpdateInterval={50}>
  {generatedMarkdown}
</InkstreamMarkdown>
```

`streamingUpdateInterval` coalesces generated-source display updates in milliseconds. The default `0` updates immediately. It applies only during generation and does not postpone the timer on each new chunk. Setting `streaming=false` shows the latest full source immediately. Initial rendering and SSR show the current input. Negative, non-finite, and out-of-range timer values fall back to immediate updates.

Controlled input values, events, and interaction gates are not delayed. Block completion uses the displayed snapshot. Unchanged text skips parsing on UI-state updates; changed text, parser configuration, or custom renderers still reparses the full document. Stable `components` and `resolveWikilink` references allow reuse. This is not incremental parsing.

In a repository checkout, `npm run benchmark:streaming` measures 20 state and text updates on documents of roughly 10k and 50k characters. Resolver calls count parsing passes; React Profiler measures local render time. These are indicative development measurements, not browser frame-time or production guarantees.

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

## Math

| Syntax | Status | Notes |
| --- | --- | --- |
| `$x$` inline math | supported | enabled by default; literal dollars need `\$` |
| Separate `$$` lines around display math | supported | multiline TeX, including matrices |
| `math` code fence | supported | display math; other code fences stay literal |

React and CLI render synchronously with KaTeX HTML + MathML. Include the
existing stylesheet for CSS and local fonts. Custom pipelines must apply
`inkstreamRehypePlugins` after `remark-rehype`. Invalid formulas stay visible
and generate vfile diagnostics; `trust` is false. Text extraction retains
TeX without delimiters. No Zenn-specific math compatibility is promised.

### Tabs and code groups

| Component | Effective attributes | Default React behavior |
| --- | --- | --- |
| `Tabs` | `sync="false"` | first panel selected; matching titles sync within the same scope |
| `Tab` | `title` | label and content panel; outside Tabs, a titled section |
| `CodeGroup` | `sync="false"` | select code examples by title/filename/language |

Click or use Left/Right/Home/End on tab buttons. Panels stay mounted while
hidden, preserving their local state. Selection and panel identity follow the
title plus its occurrence among duplicate titles during insertion/reordering;
removing the selected panel falls back to the first remaining one. Use unique,
explicit titles (or code labels) for stable identity; unnamed fallback labels
are positional and identical-title reordering cannot distinguish content.

Synchronization works between Tabs and CodeGroup in the same scope. Each
Markdown document and each panel creates a scope: siblings inside a panel sync,
but nested groups cannot switch their ancestors or groups in another panel.
Other Markdown instances never share selection. Content outside panels retains
its original order, with the tab list immediately before the first panel.

Form submission excludes fields with a `[hidden]` ancestor, including inactive
tab panels. Inputs retain their values when switching back. Hidden Forms do
not submit. Duplicate IDs among visible fields still reject submission; use
document-wide unique field IDs for correct labels and application state. CLI/core output remains static custom elements.
These are the implemented behaviors, not a promise of all Mintlify props.

### Code-fence presentation (React)

````text
```ts:legacy.ts title="Example.ts" lines highlight="1-3,5"
const example = 1;
```
````

| Option | Behavior |
| --- | --- |
| `title="Example.ts"` | header and CodeGroup label; overrides `lang:filename` |
| `lines` / `lines="true"` | show 1-based line numbers; `lines="false"` disables them |
| `highlight="1-3,5"` | highlight individual source rows and inclusive ranges |

Titles accept double/single quotes or an unquoted word, with `\"` and `\\`
escapes inside quoted values. Simple brace literals also work for
`lines={true}` and `highlight={1-3,5}`; title expressions are not evaluated.
Explicit title takes priority over the existing CodeGroup `tab="..."` label,
then filename and the existing language/bare-label fallback.

Invalid line lists (zero/negative/reversed/non-numeric entries) are ignored
as a whole; out-of-range numbers have no effect. Numbers are display-only
and do not change the Copy button result or code text. Blank rows count.
For diff fences, numbering/highlighting counts physical rows, including hunk
headers; it does not interpret the original file's line numbers. Diff colors
remain visible and highlighting adds an inset marker.

Row presentation is present during SSR before Shiki loads, and works with
wrapping. Core/CLI preserve the meta string but do not apply presentation.
Inline code, Mermaid and math rendering are unchanged. Folding and other
Mintlify flags remain unsupported.
