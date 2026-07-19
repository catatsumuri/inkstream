import type { Root } from 'mdast';
/**
 * Remark plugin: copies the fenced code block meta string (everything after
 * the language on the opening fence, e.g. ` ```diff js:app.js `) into
 * `hProperties.metastring` so it survives the trip to hast and reaches the
 * `code` renderer component as a `metastring` prop.
 */
export declare function remarkCodeMeta(): (tree: Root) => void;
//# sourceMappingURL=remark-code-meta.d.ts.map