import { parseTreeTags } from './parse-tree-tags.js';
function collectRawLines(nodes) {
    const lines = [];
    for (const node of nodes) {
        const candidate = node;
        // A dot is not valid in an HTML tag name, so remark leaves
        // `<Tree.Folder>` lines as literal text (inside a paragraph) rather
        // than `html` nodes; collect the raw value either way.
        if ((candidate.type === 'html' || candidate.type === 'text') &&
            candidate.value !== undefined) {
            lines.push(...candidate.value.split('\n'));
            continue;
        }
        if (Array.isArray(candidate.children)) {
            lines.push(...collectRawLines(candidate.children));
        }
    }
    return lines;
}
function transform(parent) {
    for (const child of parent.children) {
        if (child.type === 'mintlifyContainer') {
            const container = child;
            if (container.name === 'Tree') {
                container.data = {
                    hName: 'tree',
                    hProperties: {
                        tree: JSON.stringify(parseTreeTags(collectRawLines(container.children))),
                    },
                };
                container.children = [];
                continue;
            }
        }
        if ('children' in child) {
            transform(child);
        }
    }
}
/**
 * Remark plugin: converts a paired JSX `<Tree>` container (produced by
 * `remarkMintlifyTags`, which must run first) into the same
 * JSON-string-carrying `tree` node the ` ```tree ` fence produces, by parsing
 * the raw `<Tree.Folder>` / `<Tree.File>` lines the container captured as
 * `html` children.
 */
export function remarkTreeTags() {
    return (tree) => {
        transform(tree);
    };
}
//# sourceMappingURL=remark-tree-tags.js.map