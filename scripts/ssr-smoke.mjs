// Consumer smoke test: loads the *built* package by its public name in plain
// Node (no bundler, no jsdom, no window/document) and server-renders a
// document that touches every browser-dependent renderer. Catches dist
// packaging mistakes and top-level browser access (window/document/
// localStorage) that only bites SSR consumers. Run after `npm run build`.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

assert.equal(typeof window, 'undefined', 'smoke test must run without a DOM');

const core = await import('@catatsumuri/inkstream');
const advanced = await import('@catatsumuri/inkstream/advanced');
const { InkstreamMarkdown } = await import('@catatsumuri/inkstream/react');

assert.equal(typeof core.normalizeInkstreamMarkdown, 'function');
assert.equal(typeof advanced.remarkMintlifyTags, 'function');

const markdown = [
    '# Title {#custom}',
    '',
    ['```js expandable lines', ...Array.from({ length: 15 }, (_, i) => `const value${i} = ${i};`), '```'].join('\n'),
    '',
    '$e^{i\\pi}+1=0$',
    '',
    '$$',
    '\\frac{a}{b}',
    '$$',
    '',
    '<Note>',
    'callout',
    '</Note>',
    '',
    '<Card',
    '  title="c"',
    '  icon="rocket"',
    '  href="/x"',
    '>',
    'body',
    '</Card>',
    '',
    ':::message alert',
    'zenn',
    ':::',
    '',
    '> [!TIP]',
    '> alert',
    '',
    '```python title="Example.py" lines highlight="1" expandable',
    'value = 42',
    '```',
    '',
    '```mermaid',
    'graph TD; A-->B',
    '```',
    '',
    '```chart:bar',
    'a: 1',
    'b: 2',
    '```',
    '',
    '```quiz',
    'question: 1+1?',
    'A: 1',
    'B: 2',
    'correct: B',
    '```',
    '',
    '```tree',
    'src/a.ts',
    '```',
    '',
    'https://www.youtube.com/watch?v=abc',
    '',
    'https://github.com/catatsumuri/inkstream/blob/main/package.json',
    '',
    'https://example.com',
    '',
    '[[a/b|c]]',
    '',
    '![img](/x.png =250x)',
].join('\n');

const html = renderToString(
    createElement(InkstreamMarkdown, {
        children: markdown,
        ogpEndpoint: '/ogp',
        resolveWikilink: (path) => ({ url: `/${path}`, exists: true }),
    }),
);

assert.match(html, /class="ink-markdown"/);
assert.match(html, /callout/);
assert.match(html, /id="custom"/);
assert.match(html, /language-python/);
assert.match(html, /Example\.py/);
assert.match(html, /data-line-number="1"/);
assert.match(html, /ink-code-line-highlighted/);
assert.match(html, /aria-expanded="false"/);
assert.match(html, /Show more/);
assert.match(html, /x\.png/);

const generativeUiHtml = renderToString(
    createElement(InkstreamMarkdown, {
        children: [
            '<Card title="Security review">',
            '<Row align="center" gap="3">',
            '<Icon name="shield-check" />',
            '<Badge color="green">Complete</Badge>',
            '</Row>',
            '</Card>',
            '<Slider id="threshold" label="Threshold" min="0" max="100" default="65" />',
            '<Button action="refresh-report">Refresh report</Button>',
        ].join('\n'),
        generativeUi: true,
    }),
);

assert.match(generativeUiHtml, /class="ink-ui-row"/);
assert.match(generativeUiHtml, /style="gap:0\.75rem"/);
assert.match(generativeUiHtml, /class="ink-badge ink-badge-green"/);
assert.match(generativeUiHtml, /type="range"/);
assert.match(generativeUiHtml, /value="65"/);
assert.match(generativeUiHtml, /class="ink-ui-button"/);
assert.match(generativeUiHtml, /Refresh report/);

console.log(
    `SSR smoke test passed (${html.length + generativeUiHtml.length} bytes of HTML).`,
);

assert.match(html, /class="katex"/);
assert.match(html, /<math xmlns=/);

// Verify the built stylesheet and every referenced font can ship standalone.
const stylesheet = new URL('../dist/react/styles.css', import.meta.url);
const css = readFileSync(stylesheet, 'utf8');
assert.match(css, /@import '\.\/katex\/katex.min.css' layer\(inkstream\)/);
const mathStylesheet = new URL('./katex/katex.min.css', stylesheet);
const mathCss = readFileSync(mathStylesheet, 'utf8');
for (const match of mathCss.matchAll(/url\(([^)]+)\)/g)) {
    assert.ok(existsSync(new URL(match[1], mathStylesheet)), match[1]);
}
