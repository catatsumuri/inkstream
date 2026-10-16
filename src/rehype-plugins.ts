import type { Element, Root, RootContent } from 'hast';
import type { PluggableList } from 'unified';
import rehypeKatex from 'rehype-katex';

declare module 'hast' {
    interface ElementData {
        inkHeadingText?: string;
    }
}

/** Read heading labels before KaTeX introduces visual and accessibility copies. */
function headingSource(node: RootContent): string {
    if (node.type === 'text') return node.value;
    if (node.type !== 'element') return '';
    if (node.tagName === 'img') return String(node.properties.alt ?? '');
    const text = node.children.map(headingSource).join('');
    const classes = node.properties.className;
    return Array.isArray(classes) && classes.includes('math-inline')
        ? `$${text}$`
        : text;
}

function rehypeHeadingSource() {
    return (tree: Root): void => {
        function visit(node: Root | Element): void {
            for (const child of node.children) {
                if (child.type !== 'element') continue;
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
export const inkstreamRehypePlugins: PluggableList = [
    rehypeHeadingSource,
    [rehypeKatex, { trust: false, output: 'htmlAndMathml' }],
];
