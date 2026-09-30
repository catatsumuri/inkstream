/**
 * Runs the full string-level preprocessing chain in the order the remark
 * pipeline expects: HTML headings become Markdown headings, then Mintlify
 * block normalization (so tag bodies are
 * dedented before shorthand scanning), then Zenn directive shorthand, then
 * Zenn image size/caption encoding. Consumers should call this instead of
 * composing the individual normalizers themselves.
 */
export declare function normalizeInkstreamMarkdown(markdown: string): string;
//# sourceMappingURL=normalize-inkstream-markdown.d.ts.map