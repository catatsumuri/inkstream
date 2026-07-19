/**
 * Turns heading text into a URL-safe id slug. Unicode letters and numbers
 * are kept (Japanese headings stay readable), everything else is dropped
 * and whitespace collapses to single hyphens.
 *
 * This is the single source of truth for the "heading text → id" mapping:
 * the heading renderers and extractMarkdownHeadings both derive ids from
 * it, so anchors and tables of contents always agree.
 */
export declare function slugify(text: string): string;
//# sourceMappingURL=slugify.d.ts.map