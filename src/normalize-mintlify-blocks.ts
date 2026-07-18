import { isTagLine } from './match-tags.js';

const CODE_FENCE_RE = /^\s*(?<marker>`{3,}|~{3,})/;

/**
 * Minimal line-level pre-pass: surrounds standalone Mintlify tag lines with
 * blank lines so remark parses each tag as its own `html` flow node instead
 * of swallowing tag and content into one node. This is the only line-based
 * step in the v2 pipeline; all structure is built on the AST afterwards.
 *
 * Extra blank lines are harmless to markdown, so the pass over-inserts
 * rather than tracking context. Code fences are respected.
 */
export function normalizeMintlifyBlocks(markdown: string): string {
    const lines = markdown.split('\n');
    const out: string[] = [];
    let fenceMarker: string | null = null;

    for (const line of lines) {
        const fence = CODE_FENCE_RE.exec(line)?.groups?.marker;

        if (fence) {
            if (fenceMarker === null) {
                fenceMarker = fence;
            } else if (
                fence[0] === fenceMarker[0] &&
                fence.length >= fenceMarker.length
            ) {
                fenceMarker = null;
            }

            out.push(line);
            continue;
        }

        if (fenceMarker === null && isTagLine(line)) {
            if (out.length > 0 && out[out.length - 1].trim() !== '') {
                out.push('');
            }

            out.push(line.trim());
            out.push('');
            continue;
        }

        out.push(line);
    }

    return out.join('\n');
}
