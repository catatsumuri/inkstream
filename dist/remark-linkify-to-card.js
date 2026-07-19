import { isGithubUrl, isYoutubeUrl } from './url-matcher.js';
/** The custom element each embed type renders as. */
const EMBED_TAG_NAMES = {
    youtube: 'youtubeembed',
    github: 'githubembed',
    card: 'linkcard',
};
function isParent(node) {
    return Array.isArray(node.children);
}
function visitParagraphs(node, visitor) {
    if (node.type === 'paragraph') {
        visitor(node);
        return;
    }
    if (isParent(node)) {
        for (const child of node.children) {
            visitParagraphs(child, visitor);
        }
    }
}
/**
 * Returns the link node if the paragraph contains only a single standalone
 * link (with optional surrounding whitespace), otherwise returns null.
 */
function isStandaloneLinkInParagraph(paragraph) {
    const children = paragraph.children;
    if (children.length === 1 && children[0].type === 'link') {
        return children[0];
    }
    const linkIndex = children.findIndex((child) => child.type === 'link');
    if (linkIndex === -1) {
        return null;
    }
    const isOnlyWhitespace = (node) => {
        if (node.type === 'text') {
            return (node.value?.trim() ?? '') === '';
        }
        return node.type === 'break';
    };
    const beforeLink = children.slice(0, linkIndex);
    const afterLink = children.slice(linkIndex + 1);
    if (beforeLink.every(isOnlyWhitespace) &&
        afterLink.every(isOnlyWhitespace)) {
        return children[linkIndex];
    }
    return null;
}
function detectEmbedType(url) {
    if (isYoutubeUrl(url)) {
        return 'youtube';
    }
    if (isGithubUrl(url)) {
        return 'github';
    }
    return 'card';
}
/**
 * Converts paragraphs that consist of a single standalone http(s) URL into
 * embed elements (`linkcard`, `youtubeembed`, `githubembed`) carrying the
 * URL as an attribute. GFM autolink literals turn bare URL lines into link
 * nodes before this transform runs, so both `https://...` lines and
 * explicit `[text](url)`-only paragraphs are picked up. Ported from
 * inkstream v1's `remark-linkify-to-card`, which emitted `data-embed-*`
 * divs for an app-side dispatcher; v2 emits the custom elements the
 * default component set renders directly.
 */
export function remarkLinkifyToCard() {
    return (tree) => {
        visitParagraphs(tree, (node) => {
            const standaloneLink = isStandaloneLinkInParagraph(node);
            if (!standaloneLink) {
                return;
            }
            const url = standaloneLink.url;
            if (!url || !/^https?:\/\//.test(url)) {
                return;
            }
            const data = (node.data ??= {});
            data.hName = EMBED_TAG_NAMES[detectEmbedType(url)];
            data.hProperties = { url };
            node.children = [];
        });
    };
}
//# sourceMappingURL=remark-linkify-to-card.js.map