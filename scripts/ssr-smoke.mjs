// Consumer smoke test: loads the *built* package by its public name in plain
// Node (no bundler, no jsdom, no window/document) and server-renders a
// document that touches every browser-dependent renderer. Catches dist
// packaging mistakes and top-level browser access (window/document/
// localStorage) that only bites SSR consumers. Run after `npm run build`.
import assert from 'node:assert/strict';
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
    '<Note>',
    'callout',
    '</Note>',
    '',
    '<Card title="c" icon="rocket" href="/x">',
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
    '```python expandable',
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
assert.match(html, /x\.png/);

console.log(`SSR smoke test passed (${html.length} bytes of HTML).`);
