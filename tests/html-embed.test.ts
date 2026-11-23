import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHtmlEmbedDocument } from '../src/react/html-embed.js';
import { InkstreamMarkdown } from '../src/react/inkstream-markdown.js';

for (const syntax of ['all', 'zenn', 'basic'] as const) {
    test(`HTML embed rendering in ${syntax}`, () => {
        const html = renderToStaticMarkup(createElement(InkstreamMarkdown, { syntax, children: '```html-embed\n<div>Hello</div>\n```' }));
        assert.equal(html.includes('<iframe'), syntax !== 'basic');
        if (syntax !== 'basic') assert.match(html, /sandbox=""/);
    });
}

test('filters executable content, navigation and editable controls', () => {
    const html = createHtmlEmbedDocument('<script>alert(1)</script><a href="https://example.com">Keep link text</a><div onclick="evil()" contenteditable>safe</div><form>remove form</form><input type="text"><input type="checkbox" checked><iframe src="https://example.com"></iframe><svg><foreignObject>bad</foreignObject><circle r="5" onload="evil()"/></svg>', false);
    assert.match(html, /Keep link text/);
    assert.match(html, /type="checkbox" checked/);
    assert.match(html, /<circle/);
    assert.doesNotMatch(html, /<script|onclick|onload|contenteditable|<form|remove form|type="text"|<iframe|foreignObject|href=/);
});

test('preserves inline CSS and permitted images and selects theme styles', () => {
    const html = createHtmlEmbedDocument('<style data-theme="light">.light{color:red}</style><style data-theme="dark">.dark{color:white}</style><img src="https://example.com/a.png"><img src="/private"><div style="display:flex">flow</div>', true);
    assert.match(html, /data-theme="dark"/);
    assert.match(html, /color-scheme:dark/);
    assert.match(html, /\.dark/);
    assert.doesNotMatch(html, /\.light|src="\/private"/);
    assert.match(html, /src="https:\/\/example.com/);
    assert.match(html, /style="display:flex"/);
});

test('enforces UTF-8 byte limit', () => {
    for (const [source, accepted] of [['a'.repeat(51200), true], ['a'.repeat(51201), false], ['あ'.repeat(18000), false]] as const) {
        const html = renderToStaticMarkup(createElement(InkstreamMarkdown, { children: '```html-embed\n' + source + '\n```' }));
        assert.equal(html.includes('<iframe'), accepted);
        assert.equal(html.includes('role="alert"'), !accepted);
    }
});
