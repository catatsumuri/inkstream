import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { renderV2 } from './render-v2.js';

const CORPUS_DIR = join(import.meta.dirname, 'corpus');
const BASELINE_DIR = join(import.meta.dirname, 'baseline');
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
    const update = process.argv.includes('--update');

    mkdirSync(BASELINE_DIR, { recursive: true });
    mkdirSync(OUTPUT_DIR, { recursive: true });

    const files = readdirSync(CORPUS_DIR)
        .filter((name) => name.endsWith('.md'))
        .sort();

    let matched = 0;
    const differing: string[] = [];

    for (const file of files) {
        const name = basename(file, '.md');
        const markdown = readFileSync(join(CORPUS_DIR, file), 'utf8');
        const baselinePath = join(BASELINE_DIR, `${name}.html`);

        const rendered = renderV2(markdown);
        const html = prettify(rendered.html);

        writeFileSync(join(OUTPUT_DIR, `${name}.html`), html + '\n');

        if (rendered.warnings.length > 0) {
            for (const warning of rendered.warnings) {
                console.log(`        warning: ${warning}`);
            }
        }

        if (update) {
            writeFileSync(baselinePath, html + '\n');
            console.log(`UPDATED ${file}`);
            continue;
        }

        const baseline = existsSync(baselinePath)
            ? readFileSync(baselinePath, 'utf8').replace(/\n$/, '')
            : null;

        if (baseline === html) {
            console.log(`MATCH   ${file}`);
            matched++;
            continue;
        }

        differing.push(file);
        console.log(baseline === null ? `MISSING ${file}` : `DIFFER  ${file}`);

        if (baseline !== null) {
            const diff = lineDiff(baseline.split('\n'), html.split('\n'));

            for (const line of diff.slice(0, 12)) {
                console.log(`        ${line}`);
            }

            if (diff.length > 12) {
                console.log(`        ... (${diff.length - 12} more lines)`);
            }
        }
    }

    if (update) {
        console.log(`\nBaseline rewritten for ${files.length} fixtures.`);

        return;
    }

    console.log(`\n${matched}/${files.length} fixtures match the baseline.`);

    if (differing.length > 0) {
        console.log(`Differing: ${differing.join(', ')}`);
        console.log(
            'Current output is in golden/output/*.html; run `npm run golden -- --update` to accept.',
        );
        process.exitCode = 1;
    }
}

main();
