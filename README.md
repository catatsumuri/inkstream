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
- Golden corpus diffing v1 vs v2 output over real documents.
- Tags inside blockquotes/lists currently require blank lines around them
  (the normalizer only handles top-level tag lines); fixing this means
  splitting multi-line `html` nodes or normalizing per container.
- Inline tags (`Badge`, `Tooltip`), packaging, lint/format/CI.
