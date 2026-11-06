import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { InkstreamMarkdown } from '../src/react/index.js';
import { extractPlainText } from '../src/index.js';

const render = (children: string) => renderToStaticMarkup(createElement(InkstreamMarkdown, { children }));
const documentFor = (source: string) => new JSDOM(render(source)).window.document;

test('Frame renders a semantic figure, inline Markdown caption and preceding plain hint', () => {
    const document = documentFor('<Frame caption="**Diagram** by [author](/about) with `code`" hint="A **plain** hint">\n![Diagram](/diagram.svg)\n</Frame>');
    const figure = document.querySelector('figure')!;
    assert.equal(figure.previousElementSibling?.textContent, 'A **plain** hint');
    assert.equal(figure.querySelector('img')?.getAttribute('alt'), 'Diagram');
    assert.equal(figure.querySelector('figcaption strong')?.textContent, 'Diagram');
    assert.equal(figure.querySelector('figcaption a')?.getAttribute('href'), '/about');
    assert.equal(figure.querySelector('figcaption code')?.textContent, 'code');
    assert.equal(figure.querySelector('figcaption p'), null);
});

test('Frame without metadata omits empty captions and hints; arbitrary Markdown children survive', () => {
    const document = documentFor('<Frame>\n## Heading\n\n```js\nconst value = 1;\n```\n\n<Note>Body</Note>\n</Frame>');
    assert.equal(document.querySelector('figcaption, .ink-frame-hint'), null);
    assert.equal(document.querySelector('figure h2')?.textContent, 'Heading');
    assert.match(document.querySelector('figure code')?.textContent ?? '', /const value = 1;/);
    assert.ok(document.querySelector('figure .ink-callout-note'));
    assert.ok(documentFor('<Frame />').querySelector('figure'));
});

test('multiline, nested and incomplete streamed Frame openings follow normal block rules', () => {
    assert.equal(render('<Frame\n caption="Outer"\n hint="Hint"\n>\n<Frame caption="Inner">\nText\n</Frame>\n</Frame>'), render('<Frame caption="Outer" hint="Hint">\n<Frame caption="Inner">\nText\n</Frame>\n</Frame>'));
    const document = documentFor('<Frame caption="Streaming">\nPartial');
    assert.equal(document.querySelector('figcaption')?.textContent, 'Streaming');
    assert.equal(document.querySelector('.ink-frame-content')?.textContent?.trim(), 'Partial');
    assert.equal(documentFor('```md\n<Frame caption="Literal" />\n```').querySelector('figure'), null);
});

test('caption Markdown cannot inject HTML, dangerous links, images or Inkstream controls', () => {
    const document = documentFor('<Frame caption="[bad](javascript:alert%281%29) &lt;script&gt;alert(1)&lt;/script&gt; ![hidden](/tracking.png) &lt;Input id=&quot;x&quot; /&gt;" hint="&lt;img src=x onerror=alert(1)&gt;">\nBody\n</Frame>');
    assert.equal(document.querySelector('script, img, input'), null);
    assert.equal(document.querySelector('figcaption a')?.getAttribute('href'), '');
    assert.equal(document.querySelector('[onerror]'), null);
    assert.match(document.querySelector('.ink-frame-hint')?.textContent ?? '', /<img/);
});

test('Frame keeps existing Zenn image dimensions and captions', () => {
    const document = documentFor('<Frame caption="Frame caption">\n![Image](/image.png =240x120)\n*Image caption*\n</Frame>');
    assert.equal(document.querySelector('figure img')?.getAttribute('width'), '240');
    assert.equal(document.querySelector('figure img')?.getAttribute('height'), '120');
    assert.equal(document.querySelector('figcaption')?.textContent, 'Frame caption');
    assert.match(document.querySelector('.ink-frame-content')?.textContent ?? '', /Image caption/);
});

test('Frame children use app renderer overrides', () => {
    const html = renderToStaticMarkup(createElement(InkstreamMarkdown, {
        children: '<Frame caption="Caption">\n![Image](/image.png)\n</Frame>',
        components: { img: ({ alt }) => createElement('span', { 'data-custom-image': true }, alt) },
    }));
    assert.match(html, /data-custom-image="true"/);
    assert.match(html, /<figcaption/);
});

test('search text includes plain hint, body and caption labels without Markdown syntax', () => {
    assert.equal(extractPlainText('<Frame hint="Hint" caption="**Caption** by [author](/about)">\n![Diagram](/diagram.svg)\n</Frame>'), 'Hint\n\nDiagram\n\nCaption by author');
});
