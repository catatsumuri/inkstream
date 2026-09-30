---
name: inkstream-syntax
description: Write markdown for the inkstream renderer (@catatsumuri/inkstream) — Mintlify-style tags (<Note>, <Card>, <Steps>, <Tabs>...), Zenn :::message/:::details, GitHub alerts, tree/quiz/chart/mermaid fences, image sizing, and embeds. Use when authoring or reviewing markdown that inkstream will render, or when a tag shows up as literal text.
---

# Writing inkstream markdown

inkstream defines its own **Mintlify-style** syntax. It is not an MDX or
Mintlify-compatible parser; stick to the forms below. The authoritative,
tested table is `docs/syntax.md`.

## Rules that avoid most breakage

1. **Put each tag on its own line**, opening and closing, with content
   between (or use the one-line form `<Note>text</Note>`).
2. **Attributes must be plain `name="value"` on the same line as the tag.**
   A `>` inside the quotes is fine (`type="map<string, X>"`) and so are
   character references (`&#x22;`, decoded once). No multi-line open tags,
   no `title={"x"}`. The one exception is arrays: `tags={["A", "B"]}` works.
3. **Only known tag names.** Unknown ones (`<Foo>`) are left as raw HTML.
4. **In a blockquote, leave blank lines around a tag**
   (`> <Note>` / `>` / `> text` / `>` / `> </Note>`); without them the tag
   is not recognized. **In a list item**, indent the tag to the item's
   content column (3 spaces after `1. `, 2 after `- `) with a blank line
   before it, and it stays inside the item, including code fences in
   `Tab`/`Step`.
5. **No MDX**: no `import`/`export`, `{expressions}`, `{/* comments */}`.

## Callouts (same output in all four forms)

```markdown
<Note>text</Note>          <!-- also Tip, Info, Warning, Check -->

:::message alert
text
:::

:::details Title
text
:::

> [!WARNING]
> text
```

## Components

Block tags: `Card`, `CardGroup`, `Columns`, `Tabs`/`Tab`, `Accordion`,
`AccordionGroup`, `Expandable` (`title`, `defaultOpen`), `Steps`/`Step`,
`ResponseField`, `ParamField`, `CodeGroup`, `Update`, `Tree`. Inline: `Badge`, `Tooltip`. Nesting is
unlimited; self-closing works (`<Card title="a" href="/x" />`).
`icon="rocket"` on Card/Accordion uses a Lucide icon name (kebab-case).
`cols="1".."4"` on Columns/CardGroup.

```markdown
<Steps>
<Step title="Install">
run it
</Step>
</Steps>
```

## Fences

- ` ```tree ` — one slash path per line (`src/lib/a.ts`) or `tree`-command output.
- ` ```quiz ` — `question:`, `A:`, `B:`, ..., `correct: B`, optional
  `hint:` / `explanation:`.
- ` ```chart:bar ` / ` ```chart:radar ` — `label: value` lines.
- ` ```mermaid ` — diagrams.
- Code meta: ` ```php:index.php ` (filename), ` ```diff js:app.js ` (diff).
  Extra flags after the language (`expandable`, `theme={null}`) are ignored
  but do not break highlighting.

A malformed tree/quiz/chart fence stays a plain code block.

## Zenn / links / embeds

- Image size: `![alt](/x.png =250x)`; a `*caption*` line right under it.
- A URL alone on its own line becomes an embed: YouTube, GitHub blob
  (`.../blob/main/file#L1-L9`), or otherwise a link card.
- `@[card](url)` and `@[github](url)` work; `@[youtube]`, `@[tweet]` and
  other Zenn embeds do **not**.
- `[[path]]` / `[[path|label]]` wikilinks only work if the app supplies a
  resolver; otherwise they render literally.
- Fragment target: an empty `<a id="x" />` (or `<a id="x"></a>`) becomes an
  anchor that `[link](#x)` can jump to. Only a bare `id`/`name` is accepted;
  an `<a>` with `href` or a label stays literal.
- Explicit heading id: `## Title {#custom-id}` (applied by the React
  renderer; the CLI `render`/`text` output leaves it in the text).
- Strikethrough needs `~~two~~` tildes.

## If something renders literally

Check, in order: tag on its own line? attribute on one line, plain quotes?
known tag name? blank lines around it inside a blockquote/list? Then see
`docs/syntax.md`. Programmatic diagnostics are available from the library
(vfile messages), not the CLI.
