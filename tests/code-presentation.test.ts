import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseCodeOptions } from '../src/code-options.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { act, createElement } = await import('react');
const { createRoot, hydrateRoot } = await import('react-dom/client');
const { InkstreamMarkdown } = await import('../src/react/index.js');
const ssr = (children: string) => renderToStaticMarkup(createElement(InkstreamMarkdown, { children }));
const fence = (meta: string, code = 'const x = 1;\n\nconsole.log(x);') => `\`\`\`ts ${meta}\n${code}\n\`\`\``;

async function mount(source: string) {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(InkstreamMarkdown, { children: source })));
    return { container, root, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
}

test('presentation options parse literal strings and safe ranges without interpreting expressions', () => {
    assert.deepEqual(parseCodeOptions('title="Example file.ts" lines highlight="1-3, 5"'), {
        title: 'Example file.ts', lineNumbers: true, highlight: [[1, 3], [5, 5]],
    });
    assert.equal(parseCodeOptions("title='Single quote' lines={true} highlight={2,4-6}").title, 'Single quote');
    assert.deepEqual(parseCodeOptions('highlight={2,4-6}').highlight, [[2, 2], [4, 6]]);
    assert.equal(parseCodeOptions('title=app.ts lines=false').lineNumbers, false);
    assert.equal(parseCodeOptions('title="lines highlight=2"').lineNumbers, false);
    assert.deepEqual(parseCodeOptions('title="lines highlight=2"').highlight, []);
    assert.equal(parseCodeOptions('title={process.exit()} lines').title, undefined);
    assert.equal(parseCodeOptions('title="unfinished lines').lineNumbers, false);
    assert.equal(parseCodeOptions('title="Run \\"node\\""').title, 'Run "node"');
    assert.equal(parseCodeOptions('theme={null} expandable lines').lineNumbers, true);
    assert.equal(parseCodeOptions('title=""').title, undefined);
    for (const value of ['0', '-1', '3-1', '1,x', '1,', '9007199254740992', 'run()']) {
        assert.deepEqual(parseCodeOptions(`highlight="${value}"`).highlight, [], value);
    }
});

test('SSR presents titles, numbers, blank and highlighted rows without changing the code text', () => {
    const code = 'const x = 1;\n\nconsole.log(x);';
    const document = new JSDOM(ssr(fence('title="Example.ts" lines highlight="2-3,999999999"', code))).window.document;
    assert.equal(document.querySelector('.ink-code-header > span')?.textContent, 'Example.ts');
    assert.equal(document.querySelector('pre code')?.textContent, code);
    assert.equal(document.querySelectorAll('.ink-code-line').length, 3);
    assert.deepEqual([...document.querySelectorAll('[data-line-number]')].map(node => node.getAttribute('data-line-number')), ['1', '2', '3']);
    assert.equal(document.querySelectorAll('.ink-code-line-highlighted').length, 2);
    for (const number of document.querySelectorAll('.ink-code-line-number')) {
        assert.equal(number.getAttribute('aria-hidden'), 'true');
        assert.equal(number.textContent, '');
    }
    assert.doesNotMatch(ssr(fence('lines highlight="1"', '')), /data-line-number/);
    assert.doesNotMatch(ssr(fence('highlight="invalid"')), /ink-code-line-highlighted/);
});

test('title is escaped and overrides the legacy filename without changing language', () => {
    const html = ssr('```ts:legacy.ts title=\'A <img src=x onerror=alert(1)>\'\nconst x = 1;\n```');
    const document = new JSDOM(html).window.document;
    assert.equal(document.querySelector('.ink-code-header > span')?.textContent, 'A <img src=x onerror=alert(1)>');
    assert.equal(document.querySelector('img'), null);
    assert.ok(document.querySelector('.language-ts'));
    assert.match(ssr('```ts:legacy.ts\nx\n```'), /legacy.ts/);
});

test('numbers and row highlights survive syntax highlighting, wrapping, and copying', async () => {
    const code = 'const x = 1;\n\nconsole.log(x);';
    const view = await mount(fence('title="Example.ts" lines highlight="1,3"', code));
    const copied: string[] = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { copied.push(text); } } });
    try {
        const started = Date.now();
        while (!view.container.querySelector('.ink-code-line-content span[style*="--shiki-light"]')) {
            assert.ok(Date.now() - started < 10000, 'Shiki did not load');
            await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); });
        }
        assert.equal(view.container.querySelectorAll('.ink-code-line-highlighted').length, 2);
        assert.equal(view.container.querySelector('pre code')?.textContent, code);
        await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-label="Enable line wrapping"]')!.click());
        assert.ok(view.container.querySelector('.ink-code-pre-wrap'));
        await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')!.click());
        assert.deepEqual(copied, [code]);
        await act(async () => view.root.render(createElement(InkstreamMarkdown, { children: fence('title="Updated.ts" lines="false" highlight={2}', code) })));
        assert.equal(view.container.querySelector('.ink-code-header > span')?.textContent, 'Updated.ts');
        assert.equal(view.container.querySelectorAll('[data-line-number]').length, 0);
        assert.equal(view.container.querySelectorAll('.ink-code-line-highlighted').length, 1);
    } finally { Reflect.deleteProperty(navigator, 'clipboard'); await view.cleanup(); }
});

test('diffs retain variants and copy semantics while adding title, numbers, and highlights', async () => {
    const source = '```diff ts:old.ts title="Change.ts" lines highlight="2-3"\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n```';
    const view = await mount(source);
    const copied: string[] = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { copied.push(text); } } });
    try {
        assert.equal(view.container.querySelector('.ink-code-header > span')?.textContent, 'Change.ts');
        assert.equal(view.container.querySelectorAll('.ink-code-diff-add').length, 1);
        assert.equal(view.container.querySelectorAll('.ink-code-diff-remove').length, 1);
        assert.equal(view.container.querySelectorAll('.ink-code-diff-hunk').length, 1);
        assert.equal(view.container.querySelectorAll('.ink-code-diff-numbered').length, 3);
        assert.equal(view.container.querySelectorAll('.ink-code-line-highlighted').length, 2);
        await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')!.click());
        assert.deepEqual(copied, ['@@ -1 +1 @@\nconst x = 1;\nconst x = 2;']);
    } finally { Reflect.deleteProperty(navigator, 'clipboard'); await view.cleanup(); }
});

test('CodeGroup labels and headers use the same title even when flags precede it', async () => {
    const source = '<CodeGroup>\n```ts:legacy.ts lines highlight="1" title=\'TypeScript example\'\nx\n```\n\n```python title=Python\nx\n```\n</CodeGroup>';
    const view = await mount(source);
    try {
        const buttons = [...view.container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
        assert.deepEqual(buttons.map(button => button.textContent), ['TypeScript example', 'Python']);
        assert.equal(view.container.querySelector('.ink-code-header > span')?.textContent, 'TypeScript example');
        await act(async () => buttons[1].click());
        assert.equal(view.container.querySelectorAll<HTMLElement>('[role="tabpanel"]')[1].hidden, false);
    } finally { await view.cleanup(); }
});

test('SSR numeric rows hydrate without mismatches', async () => {
    const source = fence('title="Hydrate.ts" lines highlight="1-2"');
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = ssr(source);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, createElement(InkstreamMarkdown, { children: source }), {
        onRecoverableError: error => errors.push(error),
    }); });
    try {
        assert.deepEqual(errors, []);
        assert.equal(container.querySelectorAll('[data-line-number]').length, 3);
        assert.equal(container.querySelectorAll('.ink-code-line-highlighted').length, 2);
    } finally { await act(async () => root.unmount()); container.remove(); }
});
