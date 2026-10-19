import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Node, Parent } from 'unist';
import { MINTLIFY_ATTRIBUTE_NAMES } from './manifest.js';
import { normalizeJsxArrayAttributes } from './parse-jsx-attributes.js';

const parser = unified().use(remarkParse)
    .data('micromarkExtensions', [{ disable: { null: ['htmlFlow'] } }]);
const bareAttributes: ReadonlySet<string> = new Set(MINTLIFY_ATTRIBUTE_NAMES);

/** Strip exactly the enclosing quote markers, leaving authoring indentation. */
export function quotePrefix(line: string, limit = Infinity) {
    let offset = 0;
    let depth = 0;
    while (depth < limit) {
        const match = /^[ \t]*>[ \t]?/.exec(line.slice(offset));
        if (!match) break;
        offset += match[0].length;
        depth++;
    }
    return { prefix: line.slice(0, offset), body: line.slice(offset), depth };
}

function validAttributes(raw: string): boolean {
    const value = normalizeJsxArrayAttributes(raw).trim();
    const token = /([A-Za-z_]\w*)(?:=("[^"\r\n]*"|\{(?:true|false|-?\d+(?:\.\d+)?)\}))?/y;
    let offset = 0;
    while (offset < value.length) {
        token.lastIndex = offset;
        const match = token.exec(value);
        if (!match || (match[2] === undefined && !bareAttributes.has(match[1]))) return false;
        offset = token.lastIndex;
        if (offset < value.length && !/\s/.test(value[offset])) return false;
        while (offset < value.length && /\s/.test(value[offset])) offset++;
    }
    return true;
}

function closingAngle(value: string): number {
    let quoted = false;
    for (let index = 0; index < value.length; index++) {
        if (value[index] === '"') quoted = !quoted;
        if (value[index] === '>' && !quoted) return index;
    }
    return -1;
}

/** Read complete multiline open tags; unsupported/incomplete input is untouched. */
export function createMultilineTagReader(source: string, lines: string[], names: readonly string[]) {
    const known = new Set(names);
    let codeRanges: [number, number][] | undefined;
    let offsets: number[];
    const inCode = (line: number, column: number): boolean => {
        if (!codeRanges) {
            codeRanges = [];
            offsets = [];
            let offset = 0;
            for (const value of lines) { offsets.push(offset); offset += value.length + 1; }
            const collect = (node: Node): void => {
                if (node.position && (node.type === 'inlineCode' || (node.type === 'code'
                    && /^(?:`{3,}|~{3,})/.test(source.slice(node.position.start.offset!))))) {
                    codeRanges!.push([node.position.start.offset!, node.position.end.offset!]);
                }
                if ('children' in node) (node as Parent).children.forEach(collect);
            };
            collect(parser.parse(source));
        }
        const offset = offsets[line] + column;
        return codeRanges.some(([start, end]) => start <= offset && offset < end);
    };
    return (start: number): { line: string; end: number } | null => {
        const quote = quotePrefix(lines[start]);
        const match = /^([ \t]*)<([A-Za-z]\w*)(?=[ \t]|$)(.*)$/.exec(quote.body);
        if (!match || !known.has(match[2]) || closingAngle(match[3]) >= 0 || !validAttributes(match[3])) return null;
        if (inCode(start, quote.prefix.length + match[1].length)) return null;
        const attributes = [match[3].trim()];
        for (let index = start + 1; index < lines.length; index++) {
            const next = quotePrefix(lines[index], quote.depth);
            if (next.depth !== quote.depth || next.body.trim() === '') return null;
            const part = next.body.trim();
            const end = closingAngle(part);
            if (end >= 0) {
                if (part.slice(end + 1).trim()) return null;
                const selfClosing = part[end - 1] === '/';
                const last = part.slice(0, selfClosing ? end - 1 : end);
                if (!validAttributes(last)) return null;
                attributes.push(last.trim());
                const joined = attributes.filter(Boolean).join(' ');
                return {
                    line: `${quote.prefix}${match[1]}<${match[2]}${joined ? ` ${joined}` : ''}${selfClosing ? ' />' : '>'}`,
                    end: index,
                };
            }
            if (!validAttributes(part)) return null;
            attributes.push(part);
        }
        return null;
    };
}
