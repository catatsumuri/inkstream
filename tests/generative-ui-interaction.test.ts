import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { InkstreamMarkdown } from '../src/react/index.js';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    customElements: dom.window.customElements,
});
Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { act } = await import('react');
const { createRoot } = await import('react-dom/client');

test('button action is reported as data and generated handlers are ignored', async () => {
    const events: unknown[] = [];
    const markdown =
        '<Button action="refresh-report" onClick="alert(1)">Refresh</Button>';
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: markdown,
            generativeUi: true,
        }),
    );
    assert.match(html, /<button type="button" class="ink-ui-button">Refresh<\/button>/);

    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });
    await act(async () => {
        container.querySelector('button')!.click();
    });

    assert.deepEqual(events, [{ type: 'action', action: 'refresh-report' }]);
    await act(async () => root.unmount());
});

test('adjacent inline Button tags stay separate in one Markdown paragraph', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children:
                '<Button action="refresh-report">Refresh</Button>\n<Button action="delete-all">Delete</Button>',
            generativeUi: true,
        }),
    );
    assert.equal((html.match(/class="ink-ui-button"/g) ?? []).length, 2);
    assert.match(html, /Refresh/);
    assert.match(html, /Delete/);
});

test('slider renders in SSR and notifies the app when its value changes', async () => {
    const markdown =
        '<Slider id="threshold" label="Threshold" min="0" max="100" step="5" default="65" />';
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: markdown,
            generativeUi: true,
            generativeUiValues: { threshold: 25 },
        }),
    );
    assert.match(html, /type="range"/);
    assert.match(html, /aria-label="Threshold"/);
    assert.match(html, /value="25"/);

    const events: unknown[] = [];
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                generativeUiValues: { threshold: 25 },
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });

    const slider = container.querySelector(
        'input[type="range"]',
    ) as HTMLInputElement;
    await act(async () => {
        Object.getOwnPropertyDescriptor(
            dom.window.HTMLInputElement.prototype,
            'value',
        )!.set!.call(slider, '75');
        slider.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    assert.deepEqual(events, [{ type: 'change', id: 'threshold', value: 75 }]);

    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                generativeUiValues: { threshold: 75 },
                onGenerativeUiEvent: () => undefined,
            }),
        );
    });
    assert.equal(slider.value, '75');

    await act(async () => root.unmount());
});

test('slider clamps controlled values and rejects malformed attributes', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children:
                '<Slider id="threshold" min="0" max="100" default="65" />\n\n<Slider id="bad id" min="0" max="100" />',
            generativeUi: true,
            generativeUiValues: { threshold: 150 },
        }),
    );
    assert.match(html, /value="100"/);
    assert.doesNotMatch(html, /id="bad id"/);
});
