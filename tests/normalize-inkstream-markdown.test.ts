import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root, RootContent } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { inkstreamRemarkPlugins } from '../src/remark-plugins.js';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';

test('normalizeInkstreamMarkdown applies all three normalizers', () => {
    const markdown = [
        '<Note>',
        'body',
        '</Note>',
        '',
        ':::message alert',
        'warning',
        ':::',
        '',
        '![diagram](/img/a.png =250x)',
    ].join('\n');

    const normalized = normalizeInkstreamMarkdown(markdown);

    assert.match(normalized, /<Note>\n\nbody\n\n<\/Note>/);
    assert.match(normalized, /:::message\{\.alert\}/);
    assert.match(normalized, /__markdown_width=250/);
});

test('normalizeInkstreamMarkdown leaves fenced code untouched', () => {
    const markdown = ['```', ':::message', 'body', ':::', '```'].join('\n');

    assert.equal(normalizeInkstreamMarkdown(markdown), markdown);
});

function parseNormalized(markdown: string): Root {
    const processor = unified().use(remarkParse).use(inkstreamRemarkPlugins);
    return processor.runSync(processor.parse(normalizeInkstreamMarkdown(markdown))) as Root;
}

function withoutPositions(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(withoutPositions);
    if (node !== null && typeof node === 'object') {
        return Object.fromEntries(Object.entries(node)
            .filter(([key]) => key !== 'position')
            .map(([key, value]) => [key, withoutPositions(value)]));
    }
    return node;
}

for (const [name, markdown] of [
    ['bullet', '* item\n\n  ```text\n  a\n  b\n  ```\n\n* next\n'],
    ['dash', '- item\n\n   ```text\n   a\n   ```\n'],
    ['ordered', '1. item\n\n   ```text\n   a\n   ```\n'],
    ['nested', '- a\n  - b\n\n    ```text\n    x\n    ```\n'],
    ['cascade', '* first\n\n  ```text\n  one\n  ```\n\n* second\n\n  ```text\n  two\n  ```\n\n## Heading\n'],
    ['meta', '* item\n\n  ```text theme={null}\n  a\n  ```\n'],
    ['top-level after list', '- item\n\n```text\na\n```\n'],
    ['relative indentation', '  ```text\n    indented\n  ```'],
    ['tilde fence', '- item\n\n  ~~~text\n  a\n  ~~~\n'],
]) {
    test(`normalization preserves fence structure: ${name}`, () => {
        assert.equal(normalizeInkstreamMarkdown(markdown), markdown);
        const processor = unified().use(remarkParse).use(inkstreamRemarkPlugins);
        const original = processor.runSync(processor.parse(markdown));
        assert.deepEqual(withoutPositions(parseNormalized(markdown)), withoutPositions(original));
    });
}

function codeValues(nodes: RootContent[]): string[] {
    return nodes.flatMap(node => node.type === 'code' ? [node.value]
        : 'children' in node ? codeValues(node.children as RootContent[]) : []);
}

for (const [name, markdown, inList] of [
    ['tab', '<Tabs>\n  <Tab title="x">\n    ```bash\n    npm i\n    ```\n  </Tab>\n</Tabs>\n', false],
    ['tab in list', '- item\n\n  <Tab title="x">\n      ```bash\n      npm i\n      ```\n  </Tab>\n', true],
] as const) {
    test(`normalization preserves code inside ${name}`, () => {
        const tree = parseNormalized(markdown);
        assert.deepEqual(codeValues(tree.children), ['npm i']);
        assert.equal(tree.children[0].type, inList ? 'list' : 'mintlifyContainer');
    });
}
