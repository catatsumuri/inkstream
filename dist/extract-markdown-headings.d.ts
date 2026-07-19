export type MarkdownHeading = {
    level: number;
    text: string;
    id: string;
};
/**
 * Extracts `#` through `####` headings from raw markdown, skipping fenced
 * code blocks, and assigns each the same id the heading renderers produce
 * (slugified text, optionally prefixed, with `-2`/`-3` suffixes for
 * duplicates). Feed the result to a table-of-contents component to get
 * links that match the rendered document's anchors.
 */
export declare function extractMarkdownHeadings(content: string, prefix?: string): MarkdownHeading[];
//# sourceMappingURL=extract-markdown-headings.d.ts.map