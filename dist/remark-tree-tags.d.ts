import type { Root } from 'mdast';
/**
 * Remark plugin: converts a paired JSX `<Tree>` container (produced by
 * `remarkMintlifyTags`, which must run first) into the same
 * JSON-string-carrying `tree` node the ` ```tree ` fence produces, by parsing
 * the raw `<Tree.Folder>` / `<Tree.File>` lines the container captured as
 * `html` children.
 */
export declare function remarkTreeTags(): (tree: Root) => void;
//# sourceMappingURL=remark-tree-tags.d.ts.map