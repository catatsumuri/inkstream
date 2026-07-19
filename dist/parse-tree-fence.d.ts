export interface TreeNode {
    type: 'folder' | 'file';
    name: string;
    defaultOpen?: boolean;
    children?: TreeNode[];
}
/**
 * Parses an indented ASCII file-tree listing (either a plain indented list
 * or `tree`-command output with `├── ` / `└── ` branches) into a nested
 * node structure. Ported from inkstream v1's `parseAsciiTreeContent`.
 */
export declare function parseTreeFence(content: string): TreeNode[];
//# sourceMappingURL=parse-tree-fence.d.ts.map