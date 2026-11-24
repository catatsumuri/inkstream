export interface TreeNode {
    type: 'folder' | 'file';
    name: string;
    defaultOpen?: boolean;
    children?: TreeNode[];
}
/**
 * Parses a file-tree listing (a plain indented list, slash-separated paths,
 * or `tree`-command output with `├── ` / `└── ` branches) into a nested
 * node structure. Ported from inkstream v1's `parseAsciiTreeContent`.
 *
 * In a plain list, an entry nests under the nearest preceding entry that is
 * indented less than it. Any consistent indent width or tabs work. Lines
 * with no indentation are independent root entries.
 */
export declare function parseTreeFence(content: string): TreeNode[];
//# sourceMappingURL=parse-tree-fence.d.ts.map