/** Code-fence presentation options. Values are literals; expressions are never evaluated. */
export interface CodeOptions {
    title?: string;
    lineNumbers: boolean;
    expandable: boolean;
    highlight: readonly (readonly [number, number])[];
}

function lineRanges(value: string): [number, number][] {
    const ranges: [number, number][] = [];
    for (const part of value.split(',')) {
        const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim());
        if (!match) return [];
        const start = Number(match[1]);
        const end = Number(match[2] ?? match[1]);
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start) return [];
        ranges.push([start, end]);
    }
    return ranges;
}

/**
 * Read named options without confusing words inside quoted titles with flags.
 * Quoted, unquoted and simple brace values are accepted for numbers/booleans;
 * a title must be a quoted or unquoted string. Malformed values stop scanning.
 */
export function parseCodeOptions(meta = ''): CodeOptions {
    const options: CodeOptions = { lineNumbers: false, expandable: false, highlight: [] };
    let offset = 0;
    while (offset < meta.length) {
        while (/\s/.test(meta[offset] ?? '') && offset < meta.length) offset++;
        const key = /^[^\s=]+/.exec(meta.slice(offset))?.[0];
        if (!key) break;
        offset += key.length;
        while (/\s/.test(meta[offset] ?? '') && offset < meta.length) offset++;
        let value: string | undefined;
        let braced = false;
        if (meta[offset] === '=') {
            offset++;
            while (/\s/.test(meta[offset] ?? '') && offset < meta.length) offset++;
            const quote = meta[offset];
            if (quote === '"' || quote === "'") {
                offset++;
                value = '';
                let closed = false;
                while (offset < meta.length) {
                    const char = meta[offset++];
                    if (char === quote) { closed = true; break; }
                    if (char === '\\' && (meta[offset] === quote || meta[offset] === '\\')) {
                        value += meta[offset++];
                    } else value += char;
                }
                if (!closed) break;
            } else if (quote === '{') {
                const end = meta.indexOf('}', offset + 1);
                if (end < 0) break;
                value = meta.slice(offset + 1, end).trim();
                braced = true;
                offset = end + 1;
            } else {
                value = /^[^\s]+/.exec(meta.slice(offset))?.[0];
                if (value === undefined) break;
                offset += value.length;
            }
            // A closed literal must end at a token boundary.
            if (offset < meta.length && !/\s/.test(meta[offset])) break;
        }
        if (key === 'title' && !braced && value?.trim()) options.title = value;
        if (key === 'lines') options.lineNumbers = value === undefined || value === 'true';
        if (key === 'expandable') options.expandable = value === undefined || value === 'true';
        if (key === 'highlight' && value !== undefined) options.highlight = lineRanges(value);
    }
    return options;
}

export function isHighlightedLine(options: CodeOptions, line: number): boolean {
    return options.highlight.some(([start, end]) => line >= start && line <= end);
}
