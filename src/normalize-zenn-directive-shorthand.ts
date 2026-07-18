const CODE_FENCE_RE = /^\s*(?<marker>`{3,}|~{3,})/;

const ZENN_MESSAGE_VARIANTS = ['alert', 'note', 'tip', 'info', 'check'];
const MESSAGE_VARIANT_PATTERN = ZENN_MESSAGE_VARIANTS.join('|');

const MESSAGE_SHORTHAND_RE = new RegExp(
    `:::message\\s+(${MESSAGE_VARIANT_PATTERN})\\b`,
);
const DETAILS_SHORTHAND_RE = /(:{3,})details\s+(.+?)$/;

/**
 * Rewrites the friendly `:::message <variant>` / `:::details <title>`
 * authoring shorthand into the `{.class}` / `[label]` syntax remark-directive
 * actually expects. The only line-based step native `:::` directive support
 * needs; everything else happens on the mdast tree via remark-directive and
 * remarkZennDirective. Ported from inkstream v1's `preprocessMarkdownSyntax`.
 */
export function normalizeZennDirectiveShorthand(markdown: string): string {
    const lines = markdown.split('\n');
    let fenceMarker: string | null = null;

    return lines
        .map((line) => {
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

                return line;
            }

            if (fenceMarker !== null) {
                return line;
            }

            return line
                .replace(MESSAGE_SHORTHAND_RE, ':::message{.$1}')
                .replace(DETAILS_SHORTHAND_RE, '$1details[$2]');
        })
        .join('\n');
}
