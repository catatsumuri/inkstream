---
name: inkstream-cli
description: Use the inkstream CLI to turn inkstream-flavoured markdown (Mintlify-style tags like <Note>/<Card>, Zenn :::message, quiz/chart/tree fences, wikilinks) into plain text, HTML, or a headings outline. Use when building search indexes, excerpts, OGP descriptions, RSS/email HTML, or a server-side table of contents from such markdown.
---

# inkstream CLI

Run without installing: `npx @catatsumuri/inkstream <command> [file]`
(or `npx inkstream ...` inside a project that depends on it).
Every command reads the file path given, or **stdin** when the path is `-`
or omitted.

## Pick the command

| Goal | Command |
| --- | --- |
| Search index, excerpt, OGP `description` | `inkstream text <file\|->` |
| Table of contents / outline | `inkstream headings <file\|-> [--json] [--prefix=<p>]` |
| HTML for RSS, email, static OGP page | `inkstream render <file\|->` |

Never index raw markdown for search: tags like `<Card title="...">` and
` ```quiz ` syntax are noise. Use `text`.

## What each one does

- **`text`** — plain prose. Tags and directives are stripped; a quiz fence
  contributes its question/options/explanation, a chart fence its title and
  labels (not the numbers), a tree fence its file and folder names, a
  wikilink its label (or the path's last segment). Explicit heading ids
  (`{#custom-id}`) are **not** stripped from heading text here.
- **`headings`** — indented outline by default; `--json` gives
  `[{level, text, id}]`. `--prefix=p` makes ids `p-<slug>` (the CLI adds the
  `-`, so pass `p`, not `p-`). `{#custom-id}` is honored and removed from
  `text`.
- **`render`** — HTML with *unstyled custom elements* (`<card>`, `<steps>`,
  `<aside class="msg note">`), not a finished page. **No heading ids** — those
  come from the React renderer. Raw HTML is passed through, so sanitize the
  output before showing untrusted input.

## Examples

```sh
inkstream text docs/guide.md > guide.txt
inkstream headings docs/guide.md --json --prefix=guide
cat note.md | inkstream render - > note.html
```

## Gotchas

- **Warnings are not shown.** Unmatched or unknown tags produce vfile
  warnings in the library, but the CLI prints none. A malformed tag just
  appears as literal text in the output. To get diagnostics, use the library
  (`file.messages` after running `inkstreamRemarkPlugins`).
- Exit code is `1` with a message on stderr for an unknown command or an
  unreadable file, `0` otherwise. `--help` prints usage (exit `0`).
- Only the three commands above exist; there are no other flags besides
  `--json` and `--prefix=` on `headings`.
- For which syntax is supported, see the `inkstream-syntax` skill or
  `docs/syntax.md`.
