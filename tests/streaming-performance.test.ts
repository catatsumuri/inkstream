import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement, act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { InkstreamMarkdown, type InkstreamMarkdownProps } from '../src/react/index.js';

const dom = new JSDOM('<div id="root"></div>');
Object.assign(globalThis, {
    window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const { createRoot } = await import('react-dom/client');
const container = () => document.getElementById('root')!;
const form = '<Form id="first" action="save">\n<Input id="query" default="initial" />\n</Form>';

test('unchanged source skips parsing while values, handlers, and heading context stay current', async () => {
    const root = createRoot(container());
    let parses = 0;
    const resolver = () => { parses++; return '/note'; };
    const events: unknown[] = [];
    const source = '[[note]]\n\n## Same\n\n## Same\n\n' + form + '\n\n<Button action="run">Run</Button>';
    const render = async (props: Partial<InkstreamMarkdownProps> = {}) => {
        await act(async () => root.render(createElement(InkstreamMarkdown, {
            children: source, generativeUi: true, streaming: true, streamingMode: 'block', resolveWikilink: resolver, ...props,
        })));
    };
    try {
        await render({ generativeUiValues: { query: 'initial' } });
        assert.equal(parses, 1);
        const input = document.getElementById('query') as HTMLInputElement;
        for (let i = 0; i < 10; i++) await render({ generativeUiValues: { query: String(i) } });
        assert.equal(parses, 1);
        assert.equal(input.value, '9');
        assert.equal(document.getElementById('query') === input, true);
        await render({ headingIdPrefix: 'guide', className: 'updated', onGenerativeUiEvent: e => events.push(e) });
        assert.equal(parses, 1);
        assert.deepEqual(Array.from(container().querySelectorAll('h2')).map(h => h.id), ['guide-same', 'guide-same-2']);
        await act(async () => container().querySelector('button')!.click());
        assert.deepEqual(events, [{ type: 'action', action: 'run' }]);
        await render({ children: source + '\n\nNew content' });
        assert.equal(parses, 2);
        let newCalls = 0;
        await render({ resolveWikilink: () => { newCalls++; return '/new'; } });
        assert.equal(newCalls, 1);
        assert.match(container().querySelector('a')!.getAttribute('href')!, /\/new/);
        await render({ components: { a: ({ children }) => createElement('span', { className: 'custom-link' }, children) } });
        assert.equal(parses, 3);
        assert.ok(container().querySelector('.custom-link'));
    } finally { await act(async () => root.unmount()); }
});

test('stream updates coalesce without starvation and completion immediately flushes latest source', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const root = createRoot(container());
    let parses = 0;
    const resolver = () => { parses++; return '/note'; };
    const initial = '[[note]]\n\n' + form;
    const pending = initial + '\n\n<Form id="second" action="save">\n<Input id="second-field" />';
    const render = async (source: string, streaming = true, value = 'initial') => {
        await act(async () => root.render(createElement(InkstreamMarkdown, {
            children: source, generativeUi: true, streaming, streamingMode: 'block',
            streamingUpdateInterval: 50, resolveWikilink: resolver, generativeUiValues: { query: value },
        })));
    };
    try {
        await render(initial);
        const input = document.getElementById('query') as HTMLInputElement;
        input.focus(); input.setSelectionRange(2, 2);
        await render(initial + '\n\nFirst chunk');
        await act(async () => t.mock.timers.tick(25));
        await render(pending, true, 'external update');
        assert.equal(parses, 1);
        assert.equal(input.value, 'external update');
        assert.equal(document.getElementById('second-field'), null);
        await act(async () => t.mock.timers.tick(24));
        assert.equal(parses, 1);
        await act(async () => t.mock.timers.tick(1));
        assert.equal(parses, 2);
        assert.ok(document.getElementById('second-field'));
        assert.equal(container().querySelectorAll('fieldset')[1].disabled, true);
        assert.equal(document.getElementById('query') === input, true);
        assert.equal(document.activeElement === input, true);
        const final = pending + '\n</Form>\n\nFinal text';
        await render(final);
        assert.equal(parses, 2);
        await render(final, false);
        assert.equal(parses, 3);
        assert.match(container().textContent!, /Final text/);
        assert.equal(container().querySelectorAll('fieldset')[1].disabled, false);
        await act(async () => t.mock.timers.tick(100));
        assert.equal(parses, 3);
        await render('[[note]]\n\nNew generation');
        assert.match(container().textContent!, /New generation/);
        await render('[[note]]\n\nPending unmount');
    } finally {
        await act(async () => root.unmount());
        await act(async () => t.mock.timers.tick(100));
        t.mock.timers.reset();
    }
});

test('invalid intervals fall back to immediate source updates and SSR shows the current snapshot', async () => {
    const root = createRoot(container());
    try {
        for (const interval of [0, -1, Number.NaN, Infinity, 2_147_483_648]) {
            const source = 'value ' + interval;
            await act(async () => root.render(createElement(InkstreamMarkdown, { children: source, streaming: true, streamingUpdateInterval: interval })));
            assert.match(container().textContent!, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        }
        const props = { children: form, generativeUi: true, streaming: true, streamingMode: 'block' as const };
        assert.equal(
            renderToStaticMarkup(createElement(InkstreamMarkdown, { ...props, streamingUpdateInterval: 100 })),
            renderToStaticMarkup(createElement(InkstreamMarkdown, props)),
        );
    } finally { await act(async () => root.unmount()); }
});

test('changing or disabling the interval cancels the previous deadline', async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const root = createRoot(container());
    const render = async (source: string, interval: number) => {
        await act(async () => root.render(createElement(InkstreamMarkdown, {
            children: source, streaming: true, streamingUpdateInterval: interval,
        })));
    };
    try {
        await render('Initial', 50);
        await render('Buffered', 50);
        await act(async () => t.mock.timers.tick(25));
        await render('Buffered', 100);
        await act(async () => t.mock.timers.tick(25));
        assert.equal(container().textContent?.trim(), 'Initial');
        await act(async () => t.mock.timers.tick(75));
        assert.equal(container().textContent?.trim(), 'Buffered');
        await render('Pending', 100);
        await render('Immediate', 0);
        assert.equal(container().textContent?.trim(), 'Immediate');
        await act(async () => t.mock.timers.tick(100));
        assert.equal(container().textContent?.trim(), 'Immediate');
    } finally {
        await act(async () => root.unmount());
        t.mock.timers.reset();
    }
});
