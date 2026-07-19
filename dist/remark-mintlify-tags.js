import { MINTLIFY_ATTRIBUTE_NAMES, MINTLIFY_BLOCK_TAG_NAMES, MINTLIFY_CALLOUT_VARIANTS, MINTLIFY_INLINE_TAG_NAMES, } from './manifest.js';
import { matchCloseTag, matchOpenTag } from './match-tags.js';
const BLOCK_TAG_NAMES = MINTLIFY_BLOCK_TAG_NAMES;
const INLINE_TAG_NAMES = MINTLIFY_INLINE_TAG_NAMES;
const ALLOWED_ATTRIBUTE_NAMES = MINTLIFY_ATTRIBUTE_NAMES;
function filterAttributes(attributes) {
    return Object.fromEntries(Object.entries(attributes).filter(([name]) => ALLOWED_ATTRIBUTE_NAMES.includes(name)));
}
function createContainer(name, attributes, children) {
    const variant = MINTLIFY_CALLOUT_VARIANTS[name];
    return {
        type: 'mintlifyContainer',
        name,
        attributes,
        children,
        data: variant
            ? { hName: 'aside', hProperties: { className: ['msg', variant] } }
            : {
                hName: name.toLowerCase(),
                hProperties: filterAttributes(attributes),
            },
    };
}
function trimBoundaryWhitespace(children) {
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
 * Converts a paragraph whose phrasing starts with a block-tag open and ends
 * with the matching close (`<Note>text</Note>` on one line) into a
 * container. Restricted to block tag names: inline tags (Badge, Tooltip)
 * are handled in place by `pairInlineChildren` instead, since their
 * container must stay nested inside the paragraph rather than replace it.
 */
function convertInlineParagraph(paragraph) {
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
    if (!open || open.selfClosing || !BLOCK_TAG_NAMES.includes(open.name)) {
        return null;
    }
    const close = matchCloseTag(last.value);
    if (!close || close.name !== open.name) {
        return null;
    }
    const inner = trimBoundaryWhitespace(children.slice(1, -1));
    return createContainer(open.name, open.attributes, inner.length > 0 ? [{ type: 'paragraph', children: inner }] : []);
}
/**
 * Pairs Mintlify open/close `html` nodes in a node array with a stack and
 * lifts the nodes between each matched pair into a `mintlifyContainer`
 * built by `createNode`. Shared by flow-level pairing (children are mdast
 * block content) and phrasing-level pairing (children are inline content);
 * only tag names in `allowedNames` are treated as pairable, so block tags
 * stay literal mid-sentence and inline tags stay literal at flow level.
 * Unmatched close tags stay literal; unclosed open tags auto-close at the
 * end of the array. Both emit vfile warnings instead of failing silently.
 */
function pairTagNodes(children, file, allowedNames, createNode) {
    const result = [];
    const stack = [];
    const closeFrame = (frame) => {
        const inner = result.splice(frame.start);
        result.push(createNode(frame.name, frame.attributes, inner));
    };
    for (const child of children) {
        if (child.type === 'html') {
            const html = child;
            const open = matchOpenTag(html.value);
            if (open && allowedNames.includes(open.name)) {
                if (open.selfClosing) {
                    result.push(createNode(open.name, open.attributes, []));
                }
                else {
                    stack.push({
                        name: open.name,
                        attributes: open.attributes,
                        start: result.length,
                    });
                }
                continue;
            }
            const close = matchCloseTag(html.value);
            if (close && allowedNames.includes(close.name)) {
                let openIndex = -1;
                for (let i = stack.length - 1; i >= 0; i--) {
                    if (stack[i].name === close.name) {
                        openIndex = i;
                        break;
                    }
                }
                if (openIndex === -1) {
                    file.message(`Unmatched closing tag </${close.name}>`, child);
                    result.push(child);
                    continue;
                }
                while (stack.length > openIndex + 1) {
                    const auto = stack.pop();
                    file.message(`<${auto.name}> auto-closed by </${close.name}>`, child);
                    closeFrame(auto);
                }
                closeFrame(stack.pop());
                continue;
            }
        }
        result.push(child);
    }
    while (stack.length > 0) {
        const frame = stack.pop();
        file.message(`<${frame.name}> was never closed`);
        closeFrame(frame);
    }
    return result;
}
function pairChildren(parent, file) {
    parent.children = pairTagNodes(parent.children, file, BLOCK_TAG_NAMES, (name, attributes, inner) => createContainer(name, attributes, inner));
}
function pairInlineChildren(children, file) {
    return pairTagNodes(children, file, INLINE_TAG_NAMES, (name, attributes, inner) => createContainer(name, attributes, inner));
}
/**
 * Recurses into pre-existing structural nesting (blockquotes, lists, ...)
 * and, for paragraphs, pairs inline tags within their phrasing content and
 * then tries to convert the whole paragraph into a block container.
 * Nesting created BY tag pairing itself (e.g. `<Steps><Step>...`) doesn't
 * need recursion: `pairChildren`'s stack reconstructs it in one flat pass
 * over the flow siblings at this level.
 */
function transform(parent, file) {
    const children = parent.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type === 'paragraph') {
            const paragraph = child;
            paragraph.children = pairInlineChildren(paragraph.children, file);
            children[i] = convertInlineParagraph(paragraph) ?? paragraph;
        }
        else if ('children' in child) {
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
    return (tree, file) => {
        transform(tree, file);
    };
}
//# sourceMappingURL=remark-mintlify-tags.js.map