/**
 * Rewrites the friendly `:::message <variant>` / `:::details <title>`
 * authoring shorthand into the `{.class}` / `[label]` syntax remark-directive
 * actually expects. The only line-based step native `:::` directive support
 * needs; everything else happens on the mdast tree via remark-directive and
 * remarkZennDirective. Zenn's `@[card](url)` / `@[github](url)` embeds are
 * reduced to bare URL lines for a linkify-style renderer to pick up.
 * Ported from inkstream v1's `preprocessMarkdownSyntax`, including its
 * protection of code fences and inline code spans, so literal syntax
 * examples written as `` `:::message alert` `` prose survive. Both
 * patterns are anchored to the start of the line (transformOutsideCode
 * passes one full line, or the portion of one outside an inline code
 * span, per call) so mentioning the shorthand mid-sentence without
 * backticks -- "you can write :::message alert for a warning" -- isn't
 * mistaken for an actual directive.
 */
export declare function normalizeZennDirectiveShorthand(markdown: string): string;
//# sourceMappingURL=normalize-zenn-directive-shorthand.d.ts.map