export type HeadingIdDispenser = (baseId: string, self: object) => string;
/**
 * Creates a per-document id dispenser that appends `-2`, `-3`, ... to
 * duplicate base ids, mirroring extractMarkdownHeadings' numbering. The
 * `self` token gives each mounted heading a stable identity so React
 * Strict Mode's double-invoke doesn't increment the counter twice for the
 * same heading.
 */
export declare function createHeadingIdDispenser(): HeadingIdDispenser;
//# sourceMappingURL=heading-id-dispenser.d.ts.map