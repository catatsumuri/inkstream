# inkstream2 (draft)

Draft rewrite of the inkstream markdown engine. v1 converts Mintlify-style
JSX tags to colon-fence directives with a ~1,850-line line-based string
preprocessor; v2 builds the same structure directly on the mdast tree.

## Pipeline

1. `normalizeMintlifyBlocks(markdown)` — the only line-based step left: a
   dumb pass that surrounds standalone tag lines with blank lines (skipping
   code fences) so remark parses each tag as its own `html` flow node.
2. `remark-parse` — standard markdown parsing.
3. `remarkMintlifyTags` — pairs open/close `html` nodes per parent with a
   stack and lifts the siblings between them into `mintlifyContainer` nodes
   carrying `name`, `attributes`, and `data.hName`/`hProperties` for
   remark-rehype.

## What the AST approach fixes structurally

- **No nesting limit** — v1 encoded depth in colon-fence length (7 levels
  max, `10 − depth` colons); v2 nesting is just tree structure.
- **Single-line tags** — `<Note>text</Note>` in one paragraph works.
- **Self-closing tags** — `<Card title="..." />`.
- **Error tolerance with diagnostics** — unmatched close tags stay literal,
  unclosed tags auto-close at end of parent, and both emit vfile warnings
  instead of failing silently.

## Not in this draft (planned)

- tree/quiz/chart code-fence transforms (as mdast `code`-node transforms).
- Per-component attribute schemas (draft reuses the v1 global allowlist for
  `hProperties`; the full parsed attribute map is kept on the node).
- Tags inside blockquotes/lists currently require blank lines around them
  (the normalizer only handles top-level tag lines); fixing this means
  splitting multi-line `html` nodes or normalizing per container.
- Inline tags (`Badge`, `Tooltip`), packaging, lint/format/CI.

## Golden corpus (`golden/`)

Renders every `golden/corpus/*.md` fixture through both engines and diffs
the output, to catch v2 regressions/gaps against v1 as the rewrite grows.

```sh
npm run golden
```

- `golden/render-v1.ts` — the *full* intended v1 pipeline: every
  `remark-*-directive` plugin the package ships, not just the narrower
  zenn-directive contract-freeze subset in inkstream's own
  `tests/markdown-pipeline.ts` (kb_practice's actual `MarkdownContent.tsx`
  predates any inkstream integration, so there's no in-app v1 pipeline to
  mirror instead).
- `golden/render-v2.ts` — the current v2 pipeline
  (`normalizeMintlifyBlocks` → `remarkMintlifyTags`).
- `golden/diff.ts` — prettifies both HTML outputs to one tag per line, does
  a line diff, and writes full output to `golden/output/{v1,v2}/*.html`
  (gitignored) for inspection.
- Requires a sibling `../inkstream` checkout with `dist/` built
  (`@catatsumuri/inkstream` is a `file:` devDependency).

The fixtures are synthetic, not real thinkstream/yomitoki documents — those
weren't available in this environment. Swap in real corpus files under
`golden/corpus/` to get a truer signal; the harness doesn't care where the
`.md` files came from.

Current signal (9 fixtures): 3 match byte-for-byte (plain GFM, a
multi-line callout, an unclosed-tag warning). The 6 that differ are exactly
the gaps already listed above — single-line tag output shape, attribute
naming (`data-x-y` vs raw names), and everything not implemented yet
(tree/quiz/chart fences, native `:::` directives, inline tags). Nothing
in that list is a surprise; it's the value of running the diff for real
instead of reasoning about it.
