import type { Parent, Root } from 'mdast';
/**
 * A fragment-link target made from an empty HTML anchor
 * (`<a id="x" />`, `<a id="x"></a>`). It renders as `<span id="x">`, so
 * `[link](#x)` has something to jump to without enabling raw HTML.
 */
export interface HtmlAnchor extends Parent {
    type: 'htmlAnchor';
    children: [];
    data: {
        hName: 'span';
        hProperties: {
            id: string;
        };
    };
}
declare module 'mdast' {
    interface RootContentMap {
        htmlAnchor: HtmlAnchor;
    }
    interface BlockContentMap {
        htmlAnchor: HtmlAnchor;
    }
    interface PhrasingContentMap {
        htmlAnchor: HtmlAnchor;
    }
}
/**
 * Remark plugin: turns empty HTML anchors (`<a id="x" />`, `<a id="x"></a>`,
 * `<a name="x">` forms) into `<span id="x">` fragment targets. Only a bare
 * `id`/`name` with a safe value is accepted; anything else, including
 * anchors with `href` or event-handler attributes, stays as it was. Code
 * fences and inline code are never `html` nodes, so they are untouched.
 */
export declare function remarkHtmlAnchors(): (tree: Root) => void;
//# sourceMappingURL=remark-html-anchors.d.ts.map