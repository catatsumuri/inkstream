import test from 'node:test';
import fc from 'fast-check';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { extractMarkdownHeadings } from '../src/extract-markdown-headings.js';
import { extractPlainText } from '../src/extract-plain-text.js';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from '../src/remark-plugins.js';

// Robustness, not correctness: no input may make the pipeline throw.

const processor = unified()
    .use(remarkParse)
    .use(inkstreamRemarkPlugins)
    .use(remarkRehype);

const fragments = [
    '<Note>', '</Note>', '<Card title=">">', '<Card', 'title="x"', '</Card>',
    '<Badge>', '</Badge>', '<Tree>', '<Tree.Folder name="a">', '</Tree>',
    '<Tabs>', '<Tab title="t">', '</Tab>', '</Tabs>', '<Steps>', '</Steps>',
    ':::message', ':::message alert', ':::details x', ':::', '::::',
    '```', '```tree', '```quiz', '```chart:bar', '~~~', '`',
    '> ', '> [!NOTE]', '- ', '1. ', '# ', '## x {#id}', '[[a|b]]',
    '@[card](https://example.com)', '![a](/x.png =250x)', '*cap*',
    'https://example.com', 'tags={["A", "B"]}', '{', '}', '\n', '\n\n',
    '    ', '\t', '\r\n', 'text', '日本語',
];

const markdown = fc
    .tuple(
        fc.constantFrom('', ' ', '\n'),
        fc.array(
            fc.oneof(
                fc.constantFrom(...fragments),
                fc.string({ maxLength: 12 }),
            ),
            { maxLength: 40 },
        ),
    )
    .map(([separator, parts]) => parts.join(separator));

test('pipeline never throws on arbitrary markdown', () => {
    fc.assert(
        fc.property(markdown, (source) => {
            const normalized = normalizeInkstreamMarkdown(source);
            const tree = processor.parse(normalized);

            processor.runSync(tree);
            extractMarkdownHeadings(normalized);
            extractPlainText(normalized);
        }),
        { numRuns: 2000 },
    );
});

test('pipeline never throws on arbitrary strings', () => {
    fc.assert(
        fc.property(fc.string({ maxLength: 200 }), (source) => {
            processor.runSync(processor.parse(normalizeInkstreamMarkdown(source)));
        }),
        { numRuns: 500 },
    );
});
