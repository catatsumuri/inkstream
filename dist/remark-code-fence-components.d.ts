import type { Root } from 'mdast';
import type { VFile } from 'vfile';
/**
 * Remark plugin: converts ` ```tree `, ` ```quiz `, and ` ```chart:bar ` /
 * ` ```chart:radar ` fenced code blocks into `mintlifyContainer` nodes
 * carrying the parsed structure as a single JSON-string property (`tree`,
 * `quiz`, or `chart`), for a renderer component to read and build UI from.
 * Malformed fences emit a vfile warning and are left as plain code blocks
 * instead of failing the whole document.
 */
export declare function remarkCodeFenceComponents(): (tree: Root, file: VFile) => void;
//# sourceMappingURL=remark-code-fence-components.d.ts.map