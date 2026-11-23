import assert from 'node:assert/strict';
import test from 'node:test';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Code } from 'mdast';
import type { Node, Parent } from 'unist';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';

const parser = unified().use(remarkParse);
const literal = ['<Card', '  title="Literal"', '/>', '<Card title="Single-line literal" />'];
const after = ['<Card', '  title="After"', '/>'];
const prefixed = (prefix: string, lines: string[]) => lines.map(line => prefix + line);
function codeBlocks(source: string) {
    const blocks: { value: string; lang: string | null | undefined; ancestors: string[] }[] = [];
    const walk = (node: Node, ancestors: string[]) => {
        if (node.type === 'code') {
            const code = node as Code;
            blocks.push({ value: code.value, lang: code.lang, ancestors });
        }
        if ('children' in node) (node as Parent).children.forEach(child => walk(child, [...ancestors, node.type]));
    };
    walk(parser.parse(source), []);
    return blocks;
}
const cases = [
    { name: 'closed fence in an ordered list nested in a bullet list', lines: ['- Outer', '  1. ```md', ...prefixed('     ', literal), '     ```', '', ...after] },
    { name: 'unclosed inner list fence ends on outdent to its parent item', lines: ['- Outer', '  - ```md', ...prefixed('    ', literal), '', ...prefixed('  ', after)] },
    { name: 'unclosed inner quotation fence ends when quote depth decreases', lines: ['> > ```md', ...prefixed('> > ', literal), '>', ...prefixed('> ', after)] },
    { name: 'nested quotation inside a list with a closed tilde fence', lines: ['- Outer', '', '  > > ~~~md', ...prefixed('  > > ', literal), '  > > ~~~~', '', ...after] },
    { name: 'list nested inside two quotations with an inline fence opener', lines: ['> > - Outer', '> >   - ```md', ...prefixed('> >     ', literal), '> >     ```', '', ...after] },
    { name: 'quote-like content inside a root fence does not change its context', lines: ['```md', '> > ```', ...prefixed('> > ', literal), '~~~', ...literal, '```', '', ...after] },
    { name: 'shorter and mismatched markers inside a nested list fence stay literal', lines: ['- Outer', '  - ````md', ...prefixed('    ', literal), '    ```', '    ~~~~', ...prefixed('    ', literal), '    `````', '', ...after] },
    { name: 'unclosed continuation fence ends when nested list indentation decreases', lines: ['- Outer', '  - Inner', '', '    ```md', ...prefixed('    ', literal), '', ...prefixed('  ', after)] },
    { name: 'unclosed continuation fence in quoted list ends at the quote list boundary', lines: ['> - Item', '>', '>   ```md', ...prefixed('>   ', literal), '>', ...prefixed('> ', after)] },
    { name: 'fence in a list quotation ends when the quotation leaves its list item', lines: ['- Outer', '', '  > ```md', ...prefixed('  > ', literal), '', ...after] },
];
for (const { name, lines } of cases) {
    test(name, () => {
        const source = lines.join('\n');
        const before = codeBlocks(source);
        assert.ok(before.length > 0, 'fixture must contain a Markdown code block');
        assert.ok(before.some(block => block.value.includes('title="Literal"')), 'literal tag must be inside code');
        assert.ok(!before.some(block => block.value.includes('title="After"')), 'following tag must be outside code');
        const normalized = normalizeMintlifyBlocks(source);
        assert.deepEqual(codeBlocks(normalized), before, 'code text and container ancestry must survive normalization');
        assert.match(normalized, /<Card title="After" \/>/, 'tag following the fence must still normalize');
    });
}
