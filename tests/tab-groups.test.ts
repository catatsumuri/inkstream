import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { act, createElement } = await import('react');
const { createRoot, hydrateRoot } = await import('react-dom/client');
const { InkstreamMarkdown } = await import('../src/react/index.js');

const tabs = (sync = '') => `<Tabs ${sync}>\n<Tab title="JavaScript">\nFirst\n</Tab>\n<Tab title="Python">\nSecond\n</Tab>\n</Tabs>`;
const codeGroup = '<CodeGroup>\n```js:JavaScript\nconst x = 1;\n```\n\n```python:Python\nx = 1\n```\n</CodeGroup>';

async function mount(source: string) {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(InkstreamMarkdown, { children: source })));
    return { container, root, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
}
function groupTabs(container: Element, index = 0): HTMLButtonElement[] {
    return [...container.querySelectorAll('[role="tablist"]')[index].querySelectorAll<HTMLButtonElement>('[role="tab"]')];
}

test('tabs switch accessible panels, retain mounted content, and support keyboard navigation', async () => {
    const view = await mount(tabs());
    try {
        const buttons = groupTabs(view.container);
        const panels = [...view.container.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
        assert.equal(buttons[0].getAttribute('aria-selected'), 'true');
        assert.equal(panels[1].hidden, true);
        assert.equal(buttons[0].getAttribute('aria-controls'), panels[0].id);
        await act(async () => buttons[1].click());
        assert.equal(panels[0].hidden, true);
        assert.equal(panels[1].hidden, false);
        assert.equal(panels[0].textContent, 'First');
        for (const [key, expected] of [['ArrowRight', 0], ['End', 1], ['Home', 0], ['ArrowLeft', 1]] as const) {
            const current = buttons.find(button => button.getAttribute('aria-selected') === 'true')!;
            await act(async () => current.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true })));
            assert.equal(document.activeElement, buttons[expected]);
            assert.equal(buttons[expected].tabIndex, 0);
        }
    } finally { await view.cleanup(); }
});

test('matching titles sync Tabs and CodeGroup within a document, with an explicit opt-out', async () => {
    const view = await mount([tabs(), codeGroup, tabs('sync="false"')].join('\n\n'));
    const other = await mount(tabs());
    try {
        await act(async () => groupTabs(view.container)[1].click());
        assert.equal(groupTabs(view.container, 1)[1].getAttribute('aria-selected'), 'true');
        assert.equal(groupTabs(view.container, 2)[0].getAttribute('aria-selected'), 'true');
        assert.equal(groupTabs(other.container)[0].getAttribute('aria-selected'), 'true');
        assert.equal(view.container.querySelectorAll('.ink-code-block').length, 2);
        await act(async () => groupTabs(view.container, 1)[0].click());
        assert.equal(groupTabs(view.container)[0].getAttribute('aria-selected'), 'true');
    } finally { await view.cleanup(); await other.cleanup(); }
});

test('nested groups, duplicate titles, empty groups and content outside tabs remain usable', async () => {
    const view = await mount(`<Tabs>\nOutside\n<Tab title="Same">\n${tabs()}\n</Tab>\n<Tab title="Same">\nLast\n</Tab>\n</Tabs>\n\n<Tabs />`);
    try {
        assert.match(view.container.textContent ?? '', /Outside/);
        const buttons = groupTabs(view.container);
        await act(async () => buttons[1].click());
        assert.equal(buttons[1].getAttribute('aria-selected'), 'true');
    } finally { await view.cleanup(); }
});

test('SSR initially selects the first panel and hydrates without mismatches', async () => {
    const source = `${tabs()}\n\n${codeGroup}`;
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToStaticMarkup(createElement(InkstreamMarkdown, { children: source }));
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, createElement(InkstreamMarkdown, { children: source }), {
        onRecoverableError: error => errors.push(error),
    }); });
    assert.deepEqual(errors, []);
    assert.equal(groupTabs(container)[0].getAttribute('aria-selected'), 'true');
    await act(async () => root.unmount());
    container.remove();
});
