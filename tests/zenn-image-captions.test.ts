import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { InkstreamMarkdown } from '../src/react/index.js';

for (const syntax of ['all', 'zenn'] as const) {
    const documentFor = (children: string) => new JSDOM(renderToStaticMarkup(
        createElement(InkstreamMarkdown, { children, syntax }),
    )).window.document;

    test(`${syntax}: Zenn image captions render inline code, emphasis and links`, () => {
        const document = documentFor('![image](/image.png =250x120)\n*`findmnt /`の結果 **太字**と _強調_ [参照](/reference)*');
        const caption = document.querySelector('.ink-figure-caption')!;
        assert.equal(caption.querySelector('code')?.textContent, 'findmnt /');
        assert.equal(caption.querySelector('strong')?.textContent, '太字');
        assert.equal(caption.querySelector('em')?.textContent, '強調');
        assert.equal(caption.querySelector('a')?.getAttribute('href'), '/reference');
        assert.equal(caption.querySelector('p'), null);
        assert.equal(caption.textContent, 'findmnt /の結果 太字と 強調 参照');
        assert.equal(document.querySelector('img')?.getAttribute('src'), '/image.png');
        assert.equal(document.querySelector('img')?.getAttribute('alt'), 'image');
        assert.equal(document.querySelector('img')?.getAttribute('width'), '250');
        assert.equal(document.querySelector('img')?.getAttribute('height'), '120');
    });

    test(`${syntax}: image captions reject HTML, unsafe URLs and embedded content`, () => {
        const document = documentFor('![](/image.png)\n*[bad](javascript:alert%281%29) <script>alert(1)</script> ![hidden](/tracking.png) <Input id="x" />*');
        const caption = document.querySelector('.ink-figure-caption')!;
        assert.equal(caption.querySelector('script, img, input, iframe, [onerror]'), null);
        assert.equal(caption.querySelector('a')?.getAttribute('href'), '');
        assert.equal(document.querySelectorAll('img').length, 1);
    });

    test(`${syntax}: ordinary emphasis and fenced image examples stay outside captions`, () => {
        const document = documentFor('![](/image.png)\n\n*`ordinary` emphasis*\n\n```md\n![](/example.png)\n*`literal` caption*\n```');
        assert.equal(document.querySelector('.ink-figure-caption'), null);
        assert.equal(document.querySelector('em code')?.textContent, 'ordinary');
        assert.match(document.querySelector('pre')?.textContent ?? '', /\*`literal` caption\*/);
    });
}
