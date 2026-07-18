import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { renderV1 } from './render-v1.js';
import { renderV2 } from './render-v2.js';

const CORPUS_DIR = join(import.meta.dirname, 'corpus');
const OUTPUT_DIR = join(import.meta.dirname, 'output');

/** One HTML tag/text chunk per line, so a line diff is actually readable. */
function prettify(html: string): string {
    return html
        .replace(/></g, '>\n<')
        .split('\n')
        .filter((line) => line.trim() !== '')
        .join('\n');
}

function lineDiff(a: string[], b: string[]): string[] {
    const max = Math.max(a.length, b.length);
    const out: string[] = [];

    for (let i = 0; i < max; i++) {
        if (a[i] === b[i]) {
            continue;
        }

        if (a[i] !== undefined) {
            out.push(`- ${a[i]}`);
        }

        if (b[i] !== undefined) {
            out.push(`+ ${b[i]}`);
        }
    }

    return out;
}

function main(): void {
    mkdirSync(join(OUTPUT_DIR, 'v1'), { recursive: true });
    mkdirSync(join(OUTPUT_DIR, 'v2'), { recursive: true });

    const files = readdirSync(CORPUS_DIR)
        .filter((name) => name.endsWith('.md'))
        .sort();

    let matched = 0;
    const differing: string[] = [];

    for (const file of files) {
        const name = basename(file, '.md');
        const markdown = readFileSync(join(CORPUS_DIR, file), 'utf8');

        const v1Html = prettify(renderV1(markdown));
        const v2 = renderV2(markdown);
        const v2Html = prettify(v2.html);

        writeFileSync(join(OUTPUT_DIR, 'v1', `${name}.html`), v1Html + '\n');
        writeFileSync(join(OUTPUT_DIR, 'v2', `${name}.html`), v2Html + '\n');

        const same = v1Html === v2Html;
        const status = same ? 'MATCH' : 'DIFFER';

        console.log(`${status.padEnd(7)} ${file}`);

        if (v2.warnings.length > 0) {
            for (const warning of v2.warnings) {
                console.log(`        v2 warning: ${warning}`);
            }
        }

        if (same) {
            matched++;
        } else {
            differing.push(file);
            const diff = lineDiff(v1Html.split('\n'), v2Html.split('\n'));

            for (const line of diff.slice(0, 12)) {
                console.log(`        ${line}`);
            }

            if (diff.length > 12) {
                console.log(`        ... (${diff.length - 12} more lines)`);
            }
        }
    }

    console.log(`\n${matched}/${files.length} fixtures match byte-for-byte.`);

    if (differing.length > 0) {
        console.log(`Differing: ${differing.join(', ')}`);
        console.log(`Full HTML written to golden/output/{v1,v2}/*.html`);
    }
}

main();
