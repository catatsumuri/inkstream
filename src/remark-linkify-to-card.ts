import type { Link, Paragraph, Root, Text } from 'mdast';
import type { Node, Parent } from 'unist';
import { isGithubUrl, isYoutubeUrl } from './url-matcher.js';

export type EmbedType = 'youtube' | 'card' | 'github';

/** The custom element each embed type renders as. */
const EMBED_TAG_NAMES: Record<EmbedType, string> = {
    youtube: 'youtubeembed',
    github: 'githubembed',
    card: 'linkcard',
};

function isParent(node: Node): node is Parent {
    return Array.isArray((node as Partial<Parent>).children);
}

function visitParagraphs(
    node: Node,
    visitor: (paragraph: Paragraph) => void,
): void {
    if (node.type === 'paragraph') {
        visitor(node as Paragraph);

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
function isStandaloneLinkInParagraph(paragraph: Paragraph): Link | null {
    const children = paragraph.children;

    if (children.length === 1 && children[0].type === 'link') {
        return children[0] as Link;
    }

    const linkIndex = children.findIndex((child) => child.type === 'link');

    if (linkIndex === -1) {
        return null;
    }

    const isOnlyWhitespace = (node: (typeof children)[number]) => {
        if (node.type === 'text') {
            return ((node as Text).value?.trim() ?? '') === '';
        }

        return node.type === 'break';
    };

    const beforeLink = children.slice(0, linkIndex);
    const afterLink = children.slice(linkIndex + 1);

    if (
        beforeLink.every(isOnlyWhitespace) &&
        afterLink.every(isOnlyWhitespace)
    ) {
        return children[linkIndex] as Link;
    }

    return null;
}

function detectEmbedType(url: string): EmbedType {
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
    return (tree: Root): void => {
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
