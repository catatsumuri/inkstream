import { createElement, act, Profiler } from 'react';
import { JSDOM } from 'jsdom';
import { InkstreamMarkdown } from '../dist/react/inkstream-markdown.js';

const dom = new JSDOM('<div id="root"></div>');
Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
});
const { createRoot } = await import('react-dom/client');

for (const size of [10000, 50000]) {
    for (const scenario of ['value-updates', 'source-burst']) {
        const root = createRoot(document.getElementById('root'));
        let parses = 0;
        let duration = 0;
        const resolver = () => { parses++; return '/perf'; };
        const source = '[[perf]]\n\n'
            + '通常の文章 **強調** と説明です。\n\n'.repeat(Math.ceil(size / 22))
            + '\n\n<Form id="settings" action="save">\n<Input id="query" />\n</Form>';
        const render = async (text, value, streaming = true) => act(async () => {
            root.render(createElement(Profiler, {
                id: 'perf',
                onRender: (_id, _phase, actual) => { duration += actual; },
            }, createElement(InkstreamMarkdown, {
                children: text,
                generativeUi: true,
                streaming,
                streamingMode: 'block',
                streamingUpdateInterval: 50,
                generativeUiValues: { query: value },
                resolveWikilink: resolver,
            })));
        });
        try {
            await render(source, '0');
            parses = 0;
            duration = 0;
            const start = performance.now();
            for (let i = 1; i <= 20; i++) {
                await render(source + (scenario === 'source-burst' ? '\n\n' + '.'.repeat(i) : ''), String(i));
            }
            await render(source + (scenario === 'source-burst' ? '\n\n' + '.'.repeat(20) : ''), '20', false);
            console.log(JSON.stringify({
                characters: source.length,
                scenario,
                updates: 20,
                parses,
                reactRenderMs: Math.round(duration),
                wallMs: Math.round(performance.now() - start),
            }));
        } finally {
            await act(async () => root.unmount());
        }
    }
}
