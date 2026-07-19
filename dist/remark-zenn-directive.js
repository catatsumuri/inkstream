function isParent(node) {
    return Array.isArray(node.children);
}
function visitContainerDirectives(node, visitor) {
    if (node.type === 'containerDirective') {
        visitor(node);
    }
    if (isParent(node)) {
        for (const child of node.children) {
            visitContainerDirectives(child, visitor);
        }
    }
}
/**
 * Handles the native `:::message` / `:::details` container-directive
 * syntax (parsed by `remark-directive`, which must run before this plugin).
 * Ported from the old line-based `remark-zenn-directive` -- this is the
 * one mdast shape the tag-pairing engine here doesn't produce, since this
 * pipeline builds Mintlify callouts as `mintlifyContainer` nodes directly
 * rather than routing them through colon-fence directives.
 */
export function remarkZennDirective() {
    return (tree) => {
        visitContainerDirectives(tree, (directiveNode) => {
            if (directiveNode.name === 'message') {
                const attributes = directiveNode.attributes ?? {};
                const className = attributes.className ?? attributes.class ?? '';
                const classes = className.split(/\s+/).filter(Boolean);
                const typeClass = ['alert', 'note', 'tip', 'check'].find((c) => classes.includes(c)) ?? (attributes.alert !== undefined ? 'alert' : 'info');
                const data = directiveNode.data ?? (directiveNode.data = {});
                data.hName = 'aside';
                data.hProperties = {
                    className: ['msg', typeClass],
                };
            }
            if (directiveNode.name === 'details') {
                const bodyChildren = [...directiveNode.children];
                let summaryChildren = [
                    { type: 'text', value: 'Details' },
                ];
                // Only the directive label (`:::details[title]`) becomes the
                // summary; a plain first paragraph is body content.
                const first = bodyChildren[0];
                if (first?.type === 'paragraph' &&
                    first.data?.directiveLabel === true) {
                    bodyChildren.shift();
                    if (first.children.length > 0) {
                        summaryChildren = first.children;
                    }
                }
                const data = directiveNode.data ?? (directiveNode.data = {});
                data.hName = 'details';
                data.hProperties = {};
                directiveNode.children = [
                    {
                        type: 'paragraph',
                        data: { hName: 'summary' },
                        children: summaryChildren,
                    },
                    {
                        type: 'paragraph',
                        data: {
                            hName: 'div',
                            hProperties: { className: ['details-content'] },
                        },
                        children: bodyChildren,
                    },
                ];
            }
        });
    };
}
//# sourceMappingURL=remark-zenn-directive.js.map