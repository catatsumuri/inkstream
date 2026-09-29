# Proposal: a `/syntax` subpath, and the API surface thinkstream expects

> **Status (v0.5.2): still open, partly overtaken.** v0.5.0 added
> `@catatsumuri/inkstream/advanced` and trimmed the root exports (see
> CHANGELOG), but no `/syntax` subpath exists. Names below that lived on
> `.` at the time of writing may now be on `/advanced` (`slugify`,
> `normalizeMarkdownHeadingText`, `createHeadingIdDispenser`). Section 1's
> advice (pin a released version, not a commit SHA) still applies; releases
> now exist (`~0.5.0`). Section 2's third bucket (the `:::directive`
> plugins) remains an unanswered question about what thinkstream expects.

## Context

While wiring a table-of-contents feature into `kb_practice` (a small Laravel
practice project, unrelated to inkstream itself), I went looking at
`thinkstream` (another consumer of this package, at `../thinkstream` relative
to this repo) as a reference implementation. Two things turned up that are
worth recording here rather than losing again.

## 1. thinkstream's pinned commit is gone

`thinkstream/package.json` and `package-lock.json` pin:

```
git+ssh://git@github.com/catatsumuri/inkstream.git#be379c05f0cd88cb694c64d44ddd533e7ce59c80
```

That commit is not reachable from `origin` (`git fetch` returns
`fatal: remote error: upload-pack: not our ref ...`), and it is not in this
local clone's reflog or `git fsck --unreachable` output either. It is fully
lost — most likely force-pushed away at some point. **A fresh `npm install`
in thinkstream today will fail** on this dependency.

Longer term, pinning consumers to a tag/release (`^0.1.3`, or a future
`^0.2.0` once this proposal lands) instead of a raw commit SHA would avoid
this class of problem recurring — commit history can be rewritten, tags are
far less likely to disappear.

## 2. thinkstream expects a `/syntax` subpath that doesn't exist yet

Every non-React import in thinkstream's `resources/js` goes through
`@catatsumuri/inkstream/syntax`, not `.` or `./react`. That subpath isn't in
this package's `exports` map at all (only `.`, `./react`,
`./react/mermaid`, `./styles.css` are). Grepping thinkstream's source for
`from '@catatsumuri/inkstream/syntax'` gives the full expected surface,
which falls into three buckets:

### Already exported from `.` today — just needs to move/re-export under `/syntax`

- `extractMarkdownHeadings`, `MarkdownHeading` (type)
- `normalizeMarkdownHeadingText`
- `slugify`
- `createHeadingIdDispenser`
- `parseGithubUrl`
- `extractYoutubeVideoParameters`

### Exists today, but under a different name or in `./react`

- `extractRenderedHeadingText` — currently only in `./react/heading-components.ts`,
  which drags in `./react/default-components.js`. That file has a **static**
  top-level `import` of `recharts` (not lazy, unlike the mermaid import,
  which the comment in `inkstream-markdown.tsx` specifically calls out as
  deliberately *not* re-exported for this exact reason). Anything importing
  from `./react` today transitively requires `recharts` to resolve, even if
  the consumer only wants heading ids. `extractRenderedHeadingText` has no
  React-heavy dependencies itself and belongs in the pure-logic layer.
- `parseMarkdownImageMetadata` / `ImageMetadata` — today's `parseImageMetadata`
- `parseQuiz` — today's `parseQuizFence`
- `parseChart` — today's `parseChartFence`

### Not implemented anywhere in this repo

- `isAbsoluteUrl`
- `sanitizeMarkdownCardHref`
- `getChartDomain`
- `preprocessMarkdownContent`, `preprocessMarkdownSyntax`
- A larger set of remark directive plugins:
  `remarkAccordionGroupDirective`, `remarkApiFieldsDirective`,
  `remarkBadgeDirective`, `remarkCardDirective`, `remarkCodeGroupDirective`,
  `remarkFallbackDirective`, `remarkFixUrlPorts`, `remarkMark`,
  `remarkQuizDirective`, `remarkStepsDirective`, `remarkTabsDirective`,
  `remarkTooltipDirective`, `remarkUpdateDirective`

That last bucket is a real feature gap, not a packaging/rename issue — it
looks like a `:::directive` syntax layer (accordion/tabs/steps/badge/
api-fields/tooltip/card-group/update/fallback/mark) beyond what
`remark-directive`-based plugins this repo currently ships
(`remarkZennDirective`, `remarkMintlifyTags`, `remarkTreeTags`,
`remarkGithubAlerts`, `remarkWikilinks`, `remarkLinkifyToCard`,
`remarkCodeFenceComponents`, `remarkCodeMeta`). Whether this was built once
(inside the lost `be379c05` commit) and never merged, or was only ever
sketched out in thinkstream's imports and never actually implemented in
inkstream, I don't know — worth asking directly rather than guessing, since
reconstructing a dozen-plus directive plugins from their call sites alone
risks getting the intended syntax/behavior wrong.

## Suggested split (independent of the directive-plugin gap)

- `src/syntax.ts` (new): a barrel of the pure-logic exports — everything in
  the first two buckets above, i.e. today's whole `.` barrel minus nothing,
  plus `extractRenderedHeadingText` moved out of `./react` (it has no
  React-rendering dependency, just walks `ReactNode`). Zero dependency on
  `recharts`/`mermaid`/`shiki`/`react-markdown` rendering.
- `./react` keeps `InkstreamMarkdown`, `headingComponents`,
  `inkstreamDefaultComponents`, the embed components, `CodeBlock` — the
  actual rendering layer, which is where it's fine to require the heavy
  peer deps. It can still re-export everything from `/syntax` for
  convenience, so existing `./react` consumers don't break.
- `.` (root) can either re-export `/syntax` unchanged for backwards
  compatibility, or become a thin deprecated alias — consumers should be
  nudged toward `/syntax` for logic-only usage.

The renames (`parseImageMetadata` → `parseMarkdownImageMetadata`,
`parseQuizFence` → `parseQuiz`, `parseChartFence` → `parseChart`) are a
separate, smaller decision: either rename in place (breaking existing
consumers of `.`) or export both names from `/syntax` (old name kept on `.`
for compat, new name added to `/syntax`).

## What I did instead, for now

`kb_practice` only needed `extractMarkdownHeadings` and `slugify` (both
already on `.` today) to build its table-of-contents feature, so it depends
on this repo's current `main` (not the dead `be379c05` pin) and re-implements
the small `extractRenderedHeadingText`-equivalent locally rather than
pulling in `./react` (and therefore `recharts`) just for that one function.
See `kb_practice`'s `resources/js/lib/markdown-headings.tsx` if useful as a
reference for what that minimal local version looks like.

This file is a proposal only — nothing here has been implemented in this
repo yet.
