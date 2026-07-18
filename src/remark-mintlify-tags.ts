import type {
    Paragraph,
    Parent,
    PhrasingContent,
    Root,
    RootContent,
} from 'mdast';
import type { VFile } from 'vfile';
import { MINTLIFY_ATTRIBUTE_NAMES, MINTLIFY_CALLOUT_VARIANTS } from './manifest.js';
import { matchCloseTag, matchOpenTag } from './match-tags.js';

export interface MintlifyContainer extends Parent {
    type: 'mintlifyContainer';
    name: string;
    attributes: Record<string, string>;
    children: RootContent[];
    data?: {
        hName?: string;
        hProperties?: Record<string, string>;
    };
}

declare module 'mdast' {
    interface RootContentMap {
        mintlifyContainer: MintlifyContainer;
    }

    interface BlockContentMap {
        mintlifyContainer: MintlifyContainer;
    }
}

interface OpenFrame {
    name: string;
    attributes: Record<string, string>;
    start: number;
}

const ALLOWED_ATTRIBUTE_NAMES: readonly string[] = MINTLIFY_ATTRIBUTE_NAMES;

function filterAttributes(
    attributes: Record<string, string>,
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(attributes).filter(([name]) =>
            ALLOWED_ATTRIBUTE_NAMES.includes(name),
        ),
    );
}

function createContainer(
    name: string,
    attributes: Record<string, string>,
    children: RootContent[],
): MintlifyContainer {
    const variant =
        MINTLIFY_CALLOUT_VARIANTS[
            name as keyof typeof MINTLIFY_CALLOUT_VARIANTS
        ];

    return {
        type: 'mintlifyContainer',
        name,
        attributes,
        children,
        data: variant
            ? { hName: 'aside', hProperties: { className: `msg ${variant}` } }
            : {
                  hName: name.toLowerCase(),
                  hProperties: filterAttributes(attributes),
              },
    };
}

function trimBoundaryWhitespace(
    children: PhrasingContent[],
): PhrasingContent[] {
    const result = [...children];
    const first = result[0];

    if (first?.type === 'text') {
        first.value = first.value.replace(/^\s+/, '');

        if (first.value === '') {
            result.shift();
        }
    }

    const last = result[result.length - 1];

    if (last?.type === 'text') {
        last.value = last.value.replace(/\s+$/, '');

        if (last.value === '') {
            result.pop();
        }
    }

    return result;
}

/**
 * Converts a paragraph whose phrasing starts with an open tag and ends with
 * the matching close tag (`<Note>text</Note>` on one line) into a container.
 */
function convertInlineParagraph(paragraph: Paragraph): MintlifyContainer | null {
    const children = paragraph.children;

    if (children.length < 2) {
        return null;
    }

    const first = children[0];
    const last = children[children.length - 1];

    if (first.type !== 'html' || last.type !== 'html') {
        return null;
    }

    const open = matchOpenTag(first.value);

    if (!open || open.selfClosing) {
        return null;
    }

    const close = matchCloseTag(last.value);

    if (!close || close.name !== open.name) {
        return null;
    }

    const inner = trimBoundaryWhitespace(children.slice(1, -1));

    return createContainer(
        open.name,
        open.attributes,
        inner.length > 0 ? [{ type: 'paragraph', children: inner }] : [],
    );
}

/**
 * Pairs Mintlify open/close `html` nodes among a parent's flow children and
 * lifts the nodes between them into `mintlifyContainer` nodes. Unmatched
 * close tags stay literal; unclosed open tags auto-close at the end of their
 * parent. Both emit vfile warnings instead of failing silently.
 */
function pairChildren(parent: Parent, file: VFile): void {
    const result: RootContent[] = [];
    const stack: OpenFrame[] = [];

    const closeFrame = (frame: OpenFrame): void => {
        const children = result.splice(frame.start);
        result.push(createContainer(frame.name, frame.attributes, children));
    };

    for (const original of parent.children as RootContent[]) {
        let child = original;

        if (child.type === 'paragraph') {
            child = convertInlineParagraph(child) ?? child;
        }

        if (child.type === 'html') {
            const open = matchOpenTag(child.value);

            if (open) {
                if (open.selfClosing) {
                    result.push(
                        createContainer(open.name, open.attributes, []),
                    );
                } else {
                    stack.push({
                        name: open.name,
                        attributes: open.attributes,
                        start: result.length,
                    });
                }

                continue;
            }

            const close = matchCloseTag(child.value);

            if (close) {
                let openIndex = -1;

                for (let i = stack.length - 1; i >= 0; i--) {
                    if (stack[i].name === close.name) {
                        openIndex = i;
                        break;
                    }
                }

                if (openIndex === -1) {
                    file.message(
                        `Unmatched closing tag </${close.name}>`,
                        child,
                    );
                    result.push(child);
                    continue;
                }

                while (stack.length > openIndex + 1) {
                    const auto = stack.pop()!;
                    file.message(
                        `<${auto.name}> auto-closed by </${close.name}>`,
                        child,
                    );
                    closeFrame(auto);
                }

                closeFrame(stack.pop()!);
                continue;
            }
        }

        result.push(child);
    }

    while (stack.length > 0) {
        const frame = stack.pop()!;
        file.message(`<${frame.name}> was never closed`);
        closeFrame(frame);
    }

    parent.children = result;
}

function transform(parent: Parent, file: VFile): void {
    for (const child of parent.children) {
        if (child.type !== 'paragraph' && 'children' in child) {
            transform(child, file);
        }
    }

    pairChildren(parent, file);
}

/**
 * Remark plugin: builds Mintlify component containers by pairing tags on the
 * mdast tree. Run `normalizeMintlifyBlocks` on the source text first so each
 * standalone tag line parses as its own `html` node.
 */
export function remarkMintlifyTags() {
    return (tree: Root, file: VFile): void => {
        transform(tree, file);
    };
}
