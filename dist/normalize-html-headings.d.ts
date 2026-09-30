/**
 * Rewrites standard HTML headings (`<h1>`–`<h6>`, single or multi-line,
 * with an optional `id`) into the Markdown form the rest of the pipeline
 * already understands: `## Title {#id}`. Doing it on the string means the
 * renderer, the heading extraction API, and the CLI all see the same
 * heading with the same id and the same duplicate numbering.
 *
 * This is not an HTML parser and never emits HTML: only the heading level,
 * the text (read as inline Markdown) and a safe `id` survive. `class`,
 * `style`, event handlers, and every other attribute are dropped. A tag
 * that does not form one clean heading (content after the closing tag,
 * a blank line inside, no closing tag, empty text) is left untouched. Code
 * fences are skipped, and line count is preserved so diagnostics keep
 * pointing at the right source lines.
 */
export declare function normalizeHtmlHeadings(markdown: string): string;
//# sourceMappingURL=normalize-html-headings.d.ts.map