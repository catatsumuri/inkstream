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

const namedTabs = (titles: string[]) => `<Tabs sync="false">\n${titles.map(title =>
    `<Tab title="${title}">\n${title} body\n</Tab>`).join('\n')}\n</Tabs>`;

test('streaming insertion, reorder, removal, and empty groups retain selection by title', async () => {
    const view = await mount(namedTabs(['A', 'B']));
    try {
        await act(async () => groupTabs(view.container)[1].click());
        for (const titles of [['C', 'A', 'B'], ['B', 'C', 'A'], ['B', 'A']]) {
            await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: namedTabs(titles), streaming: true })));
            assert.equal(groupTabs(view.container).find(button => button.getAttribute('aria-selected') === 'true')?.textContent, 'B');
        }
        await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: namedTabs(['C', 'A']) })));
        assert.equal(groupTabs(view.container)[0].getAttribute('aria-selected'), 'true');
        await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: namedTabs([]) })));
        assert.equal(view.container.querySelector('[role="tablist"]'), null);
        await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: namedTabs(['B', 'A']) })));
        assert.equal(groupTabs(view.container)[0].getAttribute('aria-selected'), 'true');
    } finally { await view.cleanup(); }
});

test('nested selection cannot hide its parent, but siblings within the same panel still sync', async () => {
    const nested = '<Tabs>\n<Tab title="B">\nInner B\n</Tab>\n<Tab title="A">\nInner A\n</Tab>\n</Tabs>';
    const source = `<Tabs>\n<Tab title="B">\nOuter B\n</Tab>\n<Tab title="A">\n${nested}\n\n${nested}\n</Tab>\n</Tabs>`;
    const view = await mount(source);
    try {
        await act(async () => groupTabs(view.container)[1].click());
        assert.equal(groupTabs(view.container)[1].getAttribute('aria-selected'), 'true');
        await act(async () => groupTabs(view.container, 1)[0].click());
        assert.equal(groupTabs(view.container)[1].getAttribute('aria-selected'), 'true');
        assert.equal(groupTabs(view.container, 2)[0].getAttribute('aria-selected'), 'true');
        assert.equal(view.container.querySelectorAll<HTMLElement>('.ink-tabs > [role="tabpanel"]')[1].hidden, false);
    } finally { await view.cleanup(); }
});

test('content outside panels keeps its position before, between, and after them', async () => {
    const source = '<Tabs>\nBefore\n\n<Tab title="A">\nA body\n</Tab>\n\nBetween\n\n<Tab title="B">\nB body\n</Tab>\n\nAfter\n</Tabs>';
    const view = await mount(source);
    try {
        const children = [...view.container.querySelector('.ink-tabs')!.children];
        assert.deepEqual(children.map(child => child.getAttribute('role') ?? child.textContent),
            ['Before', 'tablist', 'tabpanel', 'Between', 'tabpanel', 'After']);
    } finally { await view.cleanup(); }
});

test('only visible Form fields are submitted and hidden duplicate ids do not reject submission', async () => {
    const events: unknown[] = [];
    const source = '<Form id="tabs-form" action="save">\n<Tabs sync="false">\n<Tab title="A">\n<Input id="choice" default="first" />\n\n<Input id="only-a" default="A" />\n</Tab>\n<Tab title="B">\n<Input id="choice" default="second" />\n\n<Input id="only-b" default="B" />\n</Tab>\n</Tabs>\n\n<Button type="submit">Save</Button>\n</Form>';
    const view = await mount('');
    try {
        await act(async () => view.root.render(createElement(InkstreamMarkdown, {
            children: source, generativeUi: true, onGenerativeUiEvent: event => events.push(event),
        })));
        const submit = async () => act(async () => {
            view.container.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
        });
        await submit();
        assert.deepEqual(events, [{ type: 'submit', id: 'tabs-form', action: 'save', values: { choice: 'first', 'only-a': 'A' } }]);
        await act(async () => groupTabs(view.container)[1].click());
        await submit();
        assert.deepEqual(events[1], { type: 'submit', id: 'tabs-form', action: 'save', values: { choice: 'second', 'only-b': 'B' } });
        // A Form itself inside a hidden ancestor must not emit a submit event.
        view.container.querySelector('form')!.hidden = true;
        await submit();
        assert.equal(events.length, 2);
    } finally { await view.cleanup(); }
});

test('tab panel inputs retain DOM identity and edits when named panels move', async () => {
    const source = (titles: string[]) => `<Tabs sync="false">\n${titles.map(title =>
        `<Tab title="${title}">\n<Input id="field-${title}" default="${title}" />\n</Tab>`).join('\n')}\n</Tabs>`;
    const view = await mount('');
    try {
        const update = async (titles: string[]) => act(async () => view.root.render(createElement(InkstreamMarkdown, {
            children: source(titles), generativeUi: true,
        })));
        await update(['A', 'B']);
        await act(async () => groupTabs(view.container)[1].click());
        const input = view.container.querySelector<HTMLInputElement>('#field-B')!;
        input.value = 'edited';
        await act(async () => groupTabs(view.container)[0].click());
        await act(async () => groupTabs(view.container)[1].click());
        assert.equal(view.container.querySelector('#field-B'), input);
        assert.equal(input.value, 'edited');
        for (const titles of [['C', 'A', 'B'], ['B', 'A', 'C']]) {
            await update(titles);
            assert.equal(view.container.querySelector('#field-B'), input);
            assert.equal(input.value, 'edited');
            assert.equal(groupTabs(view.container).find(button => button.getAttribute('aria-selected') === 'true')?.textContent, 'B');
        }
    } finally { await view.cleanup(); }
});

test('code-group selection follows a named example across streaming reorder', async () => {
    const source = (titles: string[]) => `<CodeGroup sync="false">\n${titles.map(title =>
        `\`\`\`js:${title}\n// ${title}\n\`\`\``).join('\n\n')}\n</CodeGroup>`;
    const view = await mount(source(['A', 'B']));
    try {
        await act(async () => groupTabs(view.container)[1].click());
        await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: source(['C', 'A', 'B']), streaming: true })));
        assert.equal(groupTabs(view.container)[2].getAttribute('aria-selected'), 'true');
        await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: source(['B', 'C', 'A']) })));
        assert.equal(groupTabs(view.container)[0].getAttribute('aria-selected'), 'true');
    } finally { await view.cleanup(); }
});

test('duplicate titles retain the selected occurrence when a different title is inserted', async () => {
    const view = await mount(namedTabs(['Same', 'Same']));
    try {
        await act(async () => groupTabs(view.container)[1].click());
        await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: namedTabs(['Other', 'Same', 'Same']) })));
        assert.equal(groupTabs(view.container)[2].getAttribute('aria-selected'), 'true');
    } finally { await view.cleanup(); }
});

test('nested inactive panels exclude fields while visible duplicate IDs still reject submission', async () => {
    const events: unknown[] = [];
    const nested = '<Tabs sync="false">\n<Tab title="Inner A">\n<Input id="inner-a" default="A" />\n</Tab>\n<Tab title="Inner B">\n<Input id="inner-b" default="B" />\n</Tab>\n</Tabs>';
    const source = `<Form id="nested-form" action="save">\n<Tabs sync="false">\n<Tab title="Outer A">\n<Input id="outer-a" default="A" />\n</Tab>\n<Tab title="Outer B">\n${nested}\n</Tab>\n</Tabs>\n</Form>`;
    const view = await mount('');
    try {
        await act(async () => view.root.render(createElement(InkstreamMarkdown, {
            children: source, generativeUi: true, onGenerativeUiEvent: event => events.push(event),
        })));
        await act(async () => groupTabs(view.container, 1)[1].click());
        const submit = async () => act(async () => view.container.querySelector('form')!.dispatchEvent(
            new dom.window.Event('submit', { bubbles: true, cancelable: true })));
        await submit();
        assert.deepEqual(events[0], { type: 'submit', id: 'nested-form', action: 'save', values: { 'outer-a': 'A' } });
        await act(async () => groupTabs(view.container)[1].click());
        await submit();
        assert.deepEqual(events[1], { type: 'submit', id: 'nested-form', action: 'save', values: { 'inner-b': 'B' } });
        await act(async () => view.root.render(createElement(InkstreamMarkdown, {
            children: '<Form id="duplicate" action="save">\n<Input id="same" />\n\n<Input id="same" />\n</Form>',
            generativeUi: true, onGenerativeUiEvent: event => events.push(event),
        })));
        await submit();
        assert.equal(events.length, 2);
    } finally { await view.cleanup(); }
});
