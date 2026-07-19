/**
 * Minimal line-level pre-pass: surrounds standalone Mintlify tag lines with
 * blank lines so remark parses each tag as its own `html` flow node instead
 * of swallowing tag and content into one node, and strips the authoring
 * indentation inside open tags (up to the open tag's indent + 4, mirroring
 * inkstream v1) so indented tag bodies don't turn into indented code blocks.
 * This is the only line-based step in the v2 pipeline; all structure is
 * built on the AST afterwards.
 *
 * Extra blank lines are harmless to markdown, so the pass over-inserts
 * rather than tracking paragraph context. Code fences are respected, with
 * fence content dedented by the fence line's own indentation.
 */
export declare function normalizeMintlifyBlocks(markdown: string): string;
//# sourceMappingURL=normalize-mintlify-blocks.d.ts.map