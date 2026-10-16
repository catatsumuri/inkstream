import rehypeKatex from 'rehype-katex';
/** Read heading labels before KaTeX introduces visual and accessibility copies. */
function headingSource(node) {
    if (node.type === 'text')
        return node.value;
    if (node.type !== 'element')
        return '';
    if (node.tagName === 'img')
        return String(node.properties.alt ?? '');
    const text = node.children.map(headingSource).join('');
    const classes = node.properties.className;
    return Array.isArray(classes) && classes.includes('math-inline')
        ? `$${text}$`
        : text;
}
function rehypeHeadingSource() {
    return (tree) => {
        function visit(node) {
            for (const child of node.children) {
                if (child.type !== 'element')
                    continue;
                if (/^h[1-6]$/.test(child.tagName)) {
                    child.data ??= {};
                    child.data.inkHeadingText = headingSource(child);
                }
                visit(child);
            }
        }
        visit(tree);
    };
}
/** Shared synchronous HTML transforms for React, CLI, and custom pipelines. */
export const inkstreamRehypePlugins = [
    rehypeHeadingSource,
    [rehypeKatex, { trust: false, output: 'htmlAndMathml' }],
];
//# sourceMappingURL=rehype-plugins.js.map