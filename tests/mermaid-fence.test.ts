import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>');

Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
    customElements: dom.window.customElements,
    MutationObserver: dom.window.MutationObserver,
});
Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { act } = await import('react');
const { createElement } = await import('react');
const { createRoot } = await import('react-dom/client');
const { InkstreamMarkdown } = await import('../src/react/index.js');

async function render(markdown: string): Promise<HTMLElement> {
    const container = dom.window.document.createElement('div');
    dom.window.document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(createElement(InkstreamMarkdown, { children: markdown }));
    });

    return container;
}

/**
 * The mermaid module loads through a lazy import, and jsdom cannot actually
 * lay out SVG, so the fence resolves to either the diagram container or the
 * render-error note a few ticks after the initial render.
 */
async function waitFor(
    check: () => boolean,
    label: string,
    timeoutMs = 30_000,
): Promise<void> {
    const start = Date.now();

    while (!check()) {
        assert.ok(Date.now() - start < timeoutMs, `timed out waiting for ${label}`);

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 25));
        });
    }
}

test('mermaid fences bypass the code block and reach the mermaid renderer', async () => {
    const container = await render(
        ['```mermaid', 'flowchart LR', '  A --> B', '```'].join('\n'),
    );

    assert.equal(
        container.querySelectorAll('.ink-code-block').length,
        0,
        'mermaid fences must not render as plain code blocks',
    );

    await waitFor(
        () =>
            container.querySelector('.ink-mermaid') !== null ||
            container.querySelector('.ink-mermaid-error') !== null,
        'the mermaid container or error note',
    );
});

test('other fences still render as code blocks', async () => {
    const container = await render(
        ['```js', 'const x = 1;', '```'].join('\n'),
    );

    assert.ok(container.querySelector('.ink-code-block'));
    assert.equal(container.querySelectorAll('.ink-mermaid').length, 0);
});
