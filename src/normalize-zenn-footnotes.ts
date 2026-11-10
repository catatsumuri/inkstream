import { trackFenceLine } from './transform-outside-code.js';

/** Convert inline footnotes to collision-free standard Markdown definitions. */
export function normalizeZennFootnotes(source: string): string {
    const definitions: string[] = [];
    let prefix = 'inkstream-inline-';
    while (source.includes(prefix)) prefix += 'x';
    const fence = { marker: null as string | null };
    const lines = source.split('\n').map((line) => {
        if (trackFenceLine(fence, line) || fence.marker !== null) return line;
        let output = '';
        for (let i = 0; i < line.length;) {
            if (line[i] === '\\') {
                output += line.slice(i, i + 2);
                i += 2;
                continue;
            }
            if (line[i] === '`') {
                const marker = /^`+/.exec(line.slice(i))![0];
                const end = line.indexOf(marker, i + marker.length);
                if (end !== -1) {
                    output += line.slice(i, end + marker.length);
                    i = end + marker.length;
                    continue;
                }
            }
            if (line.slice(i, i + 2) === '^[') {
                let depth = 1;
                let end = i + 2;
                for (; end < line.length && depth; end++) {
                    if (line[end] === '\\') {
                        end++;
                        continue;
                    }
                    if (line[end] === '`') {
                        const marker = /^`+/.exec(line.slice(end))![0];
                        const close = line.indexOf(marker, end + marker.length);
                        if (close !== -1) {
                            end = close + marker.length - 1;
                            continue;
                        }
                    }
                    if (line[end] === '[') depth++;
                    if (line[end] === ']') depth--;
                }
                if (!depth) {
                    const id = prefix + definitions.length;
                    definitions.push(`[^${id}]: ${line.slice(i + 2, end - 1)}`);
                    output += `[^${id}]`;
                    i = end;
                    continue;
                }
            }
            output += line[i++];
        }
        return output;
    });
    return (
        lines.join('\n') +
        (definitions.length ? '\n\n' + definitions.join('\n\n') : '')
    );
}
