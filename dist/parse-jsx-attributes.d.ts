/**
 * Flattens JSX array attribute values (`tags={["A", "B"]}` → `tags="A,B"`).
 * Also used by `normalizeMintlifyBlocks` on raw tag lines: the array form
 * contains quotes, which makes the tag invalid HTML for remark, so the line
 * must be rewritten before parsing. Ported from inkstream v1.
 */
export declare function normalizeJsxArrayAttributes(input: string): string;
/**
 * Parses the attribute portion of a JSX-style tag (`title="x" cols={2} bare`)
 * into a string map. Bare attributes become `'true'`.
 */
export declare function parseJsxAttributes(input: string): Record<string, string>;
//# sourceMappingURL=parse-jsx-attributes.d.ts.map