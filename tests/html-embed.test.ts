import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
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
        if (syntax !== 'basic') assert.match(html, /sandbox="allow-scripts"/);
    });
}

test('filters executable content, navigation and editable controls', () => {
    const html = createHtmlEmbedDocument('<script>alert(1)</script><a href="https://example.com">Keep link text</a><div onclick="evil()" contenteditable>safe</div><form>remove form</form><input type="text"><input type="checkbox" checked><iframe src="https://example.com"></iframe><svg><foreignObject>bad</foreignObject><circle r="5" onload="evil()"/></svg>', false);
    assert.match(html, /Keep link text/);
    assert.match(html, /type="checkbox" checked/);
    assert.match(html, /<circle/);
    assert.equal((html.match(/<script>/g) ?? []).length, 1);
    assert.doesNotMatch(html, /alert\(1\)|onclick|onload|contenteditable|<form|remove form|type="text"|<iframe|foreignObject|href=/);
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


test('only the trusted resize script is permitted by CSP', () => {
    const html = createHtmlEmbedDocument('<script>evil()</script><div style="height:900px">tall</div>', false);
    const document = new JSDOM(html).window.document;
    const scripts = document.querySelectorAll('script');
    assert.equal(scripts.length, 1);
    const digest = createHash('sha256').update(scripts[0].textContent).digest('base64');
    assert.ok(document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')?.includes(`script-src 'sha256-${digest}'`));
    assert.doesNotMatch(html, /evil\(\)/);
});


test('resize messages update only the sending iframe and reject invalid heights', async () => {
    const dom = new JSDOM('<!doctype html><div id="root"></div>');
    Object.assign(globalThis, { window: dom.window, document: dom.window.document, MutationObserver: dom.window.MutationObserver });
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const { act } = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { HtmlEmbed } = await import('../src/react/html-embed.js');
    const root = createRoot(dom.window.document.getElementById('root')!);
    try {
        await act(async () => root.render(createElement('div', null, createElement(HtmlEmbed, { source: '<div>one</div>' }), createElement(HtmlEmbed, { source: '<div>two</div>' }))));
        const frames = dom.window.document.querySelectorAll('iframe');
        const send = async (height: unknown, source = frames[0].contentWindow, type = 'inkstream:html-embed:resize') => {
            await act(async () => { dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source, data: { type, height } })); });
        };
        await send(272);
        assert.equal(frames[0].style.height, '272px');
        assert.equal(frames[1].style.height, '500px');
        await send(900);
        assert.equal(frames[0].style.height, '900px');
        await send(180);
        assert.equal(frames[0].style.height, '180px');
        for (const height of [0, -1, NaN, Infinity, '300', null]) await send(height);
        await send(300, null);
        await send(300, frames[0].contentWindow, 'other');
        assert.equal(frames[0].style.height, '180px');
    } finally {
        await act(async () => root.unmount());
        dom.window.close();
    }
});

test('measurement can be requested again after SSR has already sent its initial height', () => {
    const dom = new JSDOM(createHtmlEmbedDocument('<div>diagram</div>', false), { runScripts: 'outside-only' });
    const heights: number[] = [];
    let contentHeight = 272;
    let onResize = () => {};
    Object.assign(dom.window, {
        ResizeObserver: class { constructor(callback: () => void) { onResize = callback; } observe() {} disconnect() {} },
        requestAnimationFrame: (callback: () => void) => { callback(); return 1; },
        postMessage: (message: { height: number }) => heights.push(message.height),
    });
    dom.window.document.body.getBoundingClientRect = () => ({ height: contentHeight } as DOMRect);
    dom.window.eval(dom.window.document.querySelector('script')!.textContent);
    assert.deepEqual(heights, [272]);
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window as unknown as Window, data: { type: 'inkstream:html-embed:measure' } }));
    assert.deepEqual(heights, [272, 272]);
    contentHeight = 900;
    onResize();
    contentHeight = 180;
    onResize();
    assert.deepEqual(heights, [272, 272, 900, 180]);
    dom.window.close();
});
