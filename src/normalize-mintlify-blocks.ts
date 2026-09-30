import { isTagLine, matchCloseTag, matchOpenTag } from './match-tags.js';
import { normalizeJsxArrayAttributes } from './parse-jsx-attributes.js';
import { trackFenceLine, type FenceState } from './transform-outside-code.js';

interface OpenTagFrame {
    name: string;
    leadingSpaces: number;
}

interface ListFrame {
    /** Indentation of the list marker itself. */
    indent: number;
    /** Column where the item's content starts; continuation must reach it. */
    contentOffset: number;
}

const LIST_ITEM_RE = /^( *)([-*+]|\d{1,9}[.)])( +)\S/;

function leadingSpaceCount(line: string): number {
    return line.match(/^ */)?.[0].length ?? 0;
}

function stripIndent(line: string, width: number): string {
    return width > 0 ? line.replace(new RegExp(`^ {0,${width}}`), '') : line;
}

/**
 * Minimal line-level pre-pass: surrounds standalone Mintlify tag lines with
 * blank lines so remark parses each tag as its own `html` flow node instead
 * of swallowing tag and content into one node, and strips the authoring
 * indentation inside open tags (up to the open tag's indent + 4, mirroring
 * inkstream v1) so indented tag bodies don't turn into indented code blocks.
 * This is the only line-based step in the v2 pipeline; all structure is
 * built on the AST afterwards.
 *
 * Extra blank lines are harmless to markdown, so the pass over-inserts
 * rather than tracking paragraph context. Code fences are respected, with
 * fence content dedented by the fence line's own indentation.
 */
export function normalizeMintlifyBlocks(markdown: string): string {
    const lines = markdown.split('\n');
    const out: string[] = [];
    const fenceState: FenceState = { marker: null };
    const tagStack: OpenTagFrame[] = [];
    const listStack: ListFrame[] = [];
    let fenceIndent = 0;
    // Indentation of the list item a tag block was opened in. Tag blocks are
    // otherwise emitted flush-left, which would end the list; re-indenting
    // every line of the block keeps it inside the item.
    let containerIndent = 0;

    const emit = (line: string): void => {
        out.push(
            containerIndent > 0 && line.trim() !== ''
                ? ' '.repeat(containerIndent) + line
                : line,
        );
    };

    // Tracks list items outside tag blocks so a tag line can tell which
    // item, if any, it sits inside.
    const trackListLine = (line: string): void => {
        if (line.trim() === '') {
            return;
        }

        const indent = leadingSpaceCount(line);
        const item = LIST_ITEM_RE.exec(line);

        if (item) {
            while (
                listStack.length > 0 &&
                listStack[listStack.length - 1].indent >= indent
            ) {
                listStack.pop();
            }

            // More than four spaces after the marker means the content is
            // an indented code block, so the offset is marker + one space.
            const gap = item[3].length > 4 ? 1 : item[3].length;

            listStack.push({
                indent,
                contentOffset: indent + item[2].length + gap,
            });

            return;
        }

        while (
            listStack.length > 0 &&
            indent < listStack[listStack.length - 1].contentOffset
        ) {
            listStack.pop();
        }
    };

    const enclosingListOffset = (indent: number): number => {
        for (let i = listStack.length - 1; i >= 0; i--) {
            if (indent >= listStack[i].contentOffset) {
                return listStack[i].contentOffset;
            }
        }

        return 0;
    };

    for (const line of lines) {
        const tagIndentWidth =
            tagStack.length > 0
                ? (tagStack[tagStack.length - 1]?.leadingSpaces ?? 0) + 4
                : 0;
        const wasInFence = fenceState.marker !== null;
        const isFenceLine = trackFenceLine(fenceState, line);

        if (isFenceLine) {
            if (!wasInFence && fenceState.marker !== null) {
                fenceIndent = leadingSpaceCount(line);
                emit(stripIndent(line, tagIndentWidth));
            } else {
                emit(stripIndent(line, fenceIndent));

                if (fenceState.marker === null) {
                    fenceIndent = 0;
                }
            }

            continue;
        }

        if (fenceState.marker !== null) {
            emit(stripIndent(line, fenceIndent));
            continue;
        }

        if (isTagLine(line)) {
            const trimmed = line.trim();
            const open = matchOpenTag(trimmed);
            const close = matchCloseTag(trimmed);
            const wasOutsideTag = tagStack.length === 0;

            if (wasOutsideTag) {
                containerIndent = enclosingListOffset(leadingSpaceCount(line));
            }

            if (open !== null && !open.selfClosing) {
                tagStack.push({
                    name: open.name,
                    leadingSpaces: leadingSpaceCount(line),
                });
            } else if (close !== null) {
                for (let i = tagStack.length - 1; i >= 0; i--) {
                    if (tagStack[i].name === close.name) {
                        tagStack.length = i;
                        break;
                    }
                }
            }

            if (out.length > 0 && out[out.length - 1].trim() !== '') {
                out.push('');
            }

            // Array attribute values contain quotes, which make the tag
            // invalid HTML for remark; flatten them so the line parses as
            // an `html` node.
            emit(normalizeJsxArrayAttributes(trimmed));
            out.push('');

            if (tagStack.length === 0) {
                containerIndent = 0;
            }

            continue;
        }

        if (tagStack.length === 0) {
            trackListLine(line);
        }

        emit(stripIndent(line, tagIndentWidth));
    }

    return out.join('\n');
}
