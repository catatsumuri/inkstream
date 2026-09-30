import type { Html, Image, Paragraph, Parent, PhrasingContent, Root } from 'mdast';
import { readHtmlAttributes } from './parse-html-attributes.js';
import { isSafeUrl } from './safe-url.js';

// Images only load over http(s) (or a relative URL): no mailto, no data:.
const ALLOWED_SCHEMES = ['http', 'https'] as const;

// `<img ...>` / `<img ... />`; quoted attribute values may contain `>`. The
// attribute text may end in the `/` of a self-closing tag; attribute parsing
// ignores it.
const ATTRS = String.raw`(?:\s(?:[^>"']|"[^"]*"|'[^']*')*)?`;
const IMG_RE = new RegExp(`^<img(${ATTRS})>$`);
const ANY_IMG_RE = new RegExp(`<img(${ATTRS})>`, 'g');

/** A positive integer HTML dimension; `100%`, `10px`, `auto`, `0` are ignored. */
function dimension(value: string | undefined): number | undefined {
    if (value === undefined || !/^\d{1,5}$/.test(value.trim())) {
        return undefined;
    }

    const parsed = Number(value.trim());

    return parsed > 0 ? parsed : undefined;
}

/**
 * Builds an `image` node from the attributes of an `<img>` tag, or null when
 * it has no usable `src`. Only `src`, `alt`, `title`, `width` and `height`
 * are read; `class`/`className`, `style`, `srcset`, `loading`, `data-*`
 * and event handlers (`onerror`, `onload`, ...) are never read.
 */
function imageFromAttrs(attrs: string): Image | null {
    const attributes = readHtmlAttributes(attrs);
    const src = attributes.src?.trim();

    if (!src || !isSafeUrl(src, ALLOWED_SCHEMES)) {
        return null;
    }

    const image: Image = {
        type: 'image',
        url: src,
        alt: attributes.alt ?? '',
        title: attributes.title || null,
    };
    const width = dimension(attributes.width);
    const height = dimension(attributes.height);

    if (width !== undefined || height !== undefined) {
        image.data = {
            hProperties: {
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
            },
        };
    }

    return image;
}

function convertPhrasing(children: PhrasingContent[]): PhrasingContent[] {
    return children.map((child) => {
        if (child.type !== 'html') {
            return child;
        }

        const match = IMG_RE.exec((child as Html).value.trim());

        return (match ? imageFromAttrs(match[1] ?? '') : null) ?? child;
    });
}

/**
 * A flow-level `html` node made only of `<img>` tags. Consecutive image
 * lines without a blank line between them share one node, so it may hold
 * several; they become one paragraph with a space between images.
 */
function paragraphFromFlowHtml(value: string): Paragraph | null {
    const trimmed = value.trim();
    const children: PhrasingContent[] = [];
    let consumed = 0;

    for (const match of trimmed.matchAll(ANY_IMG_RE)) {
        if (trimmed.slice(consumed, match.index).trim() !== '') {
            return null;
        }

        const image = imageFromAttrs(match[1] ?? '');

        if (!image) {
            return null;
        }

        if (children.length > 0) {
            children.push({ type: 'text', value: ' ' });
        }

        children.push(image);
        consumed = match.index + match[0].length;
    }

    return children.length > 0 && consumed === trimmed.length
        ? { type: 'paragraph', children }
        : null;
}

const PHRASING_PARENTS = new Set([
    'paragraph',
    'heading',
    'tableCell',
    'emphasis',
    'strong',
    'delete',
    'link',
]);

function transform(parent: Parent): void {
    if (PHRASING_PARENTS.has(parent.type)) {
        parent.children = convertPhrasing(
            parent.children as PhrasingContent[],
        ) as Parent['children'];
    } else {
        parent.children = parent.children.map((child) =>
            child.type === 'html'
                ? (paragraphFromFlowHtml((child as Html).value) ?? child)
                : child,
        );
    }

    for (const child of parent.children) {
        if ('children' in child) {
            transform(child as Parent);
        }
    }
}

/**
 * Remark plugin: turns ordinary HTML images (`<img src alt width height>`)
 * into Markdown `image` nodes, so they take the same path as `![alt](url)`
 * (URL sanitizing, the app's custom `img` renderer). Raw HTML is never
 * enabled: only `src` (http/https/relative), `alt`, `title` and integer
 * `width`/`height` are read, and anything unusual stays literal text.
 */
export function remarkHtmlImages() {
    return (tree: Root): void => {
        transform(tree);
    };
}
