import type { Root } from 'mdast';
/**
 * `remark-directive` also parses clock times such as `09:12` as an inline
 * directive. Restore those nodes to text before they reach remark-rehype.
 */
export declare function remarkRestoreTimeText(): (tree: Root) => void;
//# sourceMappingURL=remark-restore-time-text.d.ts.map