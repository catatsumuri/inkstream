/**
 * Strips markdown inline syntax (links, images, wikilinks, raw HTML) from
 * heading source text, leaving the plain text a reader sees. Used to
 * compute heading slugs from raw markdown so they match what the
 * rendered heading's text content produces — wikilinks in particular
 * must resolve to the same label `remarkWikilinks` would render, or a
 * heading like `# See [[known]]` gets a different slug in a
 * table-of-contents (built from raw source) than in the document
 * (built from rendered output).
 */
export declare function normalizeMarkdownHeadingText(text: string): string;
//# sourceMappingURL=markdown-heading-text.d.ts.map