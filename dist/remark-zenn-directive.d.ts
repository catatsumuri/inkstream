import type { Root } from 'mdast';
/**
 * Handles the native `:::message` / `:::details` container-directive
 * syntax (parsed by `remark-directive`, which must run before this plugin).
 * Ported from the old line-based `remark-zenn-directive` -- this is the
 * one mdast shape the tag-pairing engine here doesn't produce, since this
 * pipeline builds Mintlify callouts as `mintlifyContainer` nodes directly
 * rather than routing them through colon-fence directives.
 */
export declare function remarkZennDirective(): (tree: Root) => void;
//# sourceMappingURL=remark-zenn-directive.d.ts.map