import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
// This protection-only parser exposes HTML bodies and authoring indentation.
// The real Markdown parser retains its normal HTML and indented-code rules.
const parser = unified().use(remarkParse).use(remarkMath)
    .data('micromarkExtensions', [{ disable: { null: ['htmlFlow', 'codeIndented'] } }]);
/**
 * Hide math while line-based authoring normalizers rewrite HTML/directives.
 * Each token preserves structural indentation and line count. Parse inline
 * spans with remark-math itself, rather than maintaining a second dollar
 * delimiter grammar. HTML bodies are parsed before tag normalization.
 */
export function protectMath(source) {
    if (!source.includes('$'))
        return { source, restore: value => value };
    let prefix = 'INKSTREAMMATHTOKEN';
    while (source.includes(prefix))
        prefix += 'X';
    const values = [];
    const hide = (value) => {
        const token = `${prefix}${values.length}END`;
        values.push(value);
        return token;
    };
    // Preserve multiline spans using the parser's original source ranges.
    const ranges = [];
    function collect(node) {
        if ((node.type === 'math' || node.type === 'inlineMath') && node.position) {
            ranges.push([node.position.start.offset, node.position.end.offset]);
            return;
        }
        if ('children' in node)
            node.children.forEach(collect);
    }
    collect(parser.parse(source));
    let masked = source;
    for (const [start, end] of ranges.reverse()) {
        const hidden = source.slice(start, end).split('\n').map(line => line.replace(/^([\t >]*)(.*)$/, (_, indent, body) => indent + (body ? hide(body) : ''))).join('\n');
        masked = masked.slice(0, start) + hidden + masked.slice(end);
    }
    return {
        source: masked,
        restore: (value) => value.replace(new RegExp(`${prefix}(\\d+)END`, 'g'), (_, index) => values[Number(index)]),
    };
}
//# sourceMappingURL=protect-math.js.map