/**
 * Renders inkstream markdown down to its plain, human-readable text:
 * every Mintlify tag, Zenn directive, and GFM extension resolved through
 * the same remark pipeline InkstreamMarkdown uses, with no syntax noise
 * (`<Card title=...>`, ` ```quiz `, `[[path|label]]`) and no markup.
 * Intended for full-text search indexing, excerpts, and OGP
 * descriptions, where the raw markdown source is unusable as-is.
 *
 * tree/quiz/chart fences contribute their meaningful text (a quiz's
 * question and options, a chart's title and labels, a tree's file and
 * folder names) rather than being silently dropped or dumping raw JSON.
 * Wikilinks resolve to their label (or the path's last segment) without
 * needing a resolver, matching how a heading's slug is computed.
 */
export declare function extractPlainText(markdown: string): string;
//# sourceMappingURL=extract-plain-text.d.ts.map