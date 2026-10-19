import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseCodeOptions } from '../src/code-options.js';
import { extractPlainText } from '../src/extract-plain-text.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement });
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const { act, createElement } = await import('react');
const { createRoot, hydrateRoot } = await import('react-dom/client');
const { InkstreamMarkdown } = await import('../src/react/index.js');
const code = (count: number) => Array.from({ length: count }, (_, index) => `console.log(${index + 1});`).join('\n');
const fence = (meta = 'expandable', count = 15) => `\`\`\`js ${meta}\n${code(count)}\n\`\`\``;
const ssr = (children: string) => renderToStaticMarkup(createElement(InkstreamMarkdown, { children }));
async function mount(source: string) {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(createElement(InkstreamMarkdown, { children: source })));
    return { container, root, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
}

test('expandable accepts only bare/true literals and ignores words inside titles', () => {
    for (const value of ['expandable', 'expandable=true', 'expandable="true"', 'expandable={true}']) {
        assert.equal(parseCodeOptions(value).expandable, true, value);
    }
    for (const value of ['', 'expandable=false', 'expandable="false"', 'expandable={false}', 'expandable={run()}', 'expandable=12', 'title="expandable"']) {
        assert.equal(parseCodeOptions(value).expandable, false, value);
    }
});

test('SSR previews exactly 12 source lines only when the flag and length require it', () => {
    const document = new JSDOM(ssr(fence())).window.document;
    const button = document.querySelector('.ink-code-expand-button')!;
    assert.equal(document.querySelector('pre code')?.textContent, code(12));
    assert.equal(button.textContent, 'Show more');
    assert.equal(button.getAttribute('aria-expanded'), 'false');
    assert.equal(button.getAttribute('type'), 'button');
    assert.equal(button.getAttribute('aria-controls'), document.querySelector('pre')?.id);
    for (const count of [0, 1, 12]) assert.doesNotMatch(ssr(fence('expandable', count)), /ink-code-expand-button/);
    assert.doesNotMatch(ssr(fence('expandable=false')), /ink-code-expand-button/);
    assert.doesNotMatch(ssr(fence('')), /ink-code-expand-button/);
    assert.match(ssr(fence('', 15)), /console.log\(15\)/);
    // Search/indexing text retains the whole code rather than the preview.
    assert.equal(extractPlainText(fence()), code(15));
});

test('expand/collapse preserves title, line numbers, highlights and wrapping', async () => {
    const view = await mount(fence('title="Example.js" lines highlight="2,14" expandable'));
    try {
        const button = view.container.querySelector<HTMLButtonElement>('.ink-code-expand-button')!;
        const pre = view.container.querySelector('pre')!;
        assert.equal(view.container.querySelector('.ink-code-header > span')?.textContent, 'Example.js');
        assert.equal(view.container.querySelectorAll('[data-line-number]').length, 12);
        assert.equal(view.container.querySelectorAll('.ink-code-line-highlighted').length, 1);
        await act(async () => button.click());
        assert.equal(button.getAttribute('aria-expanded'), 'true');
        assert.equal(button.textContent, 'Show less');
        assert.equal(view.container.querySelector('pre'), pre);
        assert.equal(view.container.querySelectorAll('[data-line-number]').length, 15);
        assert.equal(view.container.querySelectorAll('.ink-code-line-highlighted').length, 2);
        await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-label="Enable line wrapping"]')!.click());
        await act(async () => button.click());
        assert.equal(button.getAttribute('aria-expanded'), 'false');
        assert.ok(view.container.querySelector('.ink-code-pre-wrap'));
        assert.equal(view.container.querySelector('pre code')?.textContent, code(12));
    } finally { await view.cleanup(); }
});

test('copy always uses the complete source while collapsed', async () => {
    const view = await mount(fence());
    const copied: string[] = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { copied.push(text); } } });
    try {
        await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')!.click());
        assert.deepEqual(copied, [code(15)]);
        assert.equal(view.container.querySelector('.ink-code-expand-button')?.getAttribute('aria-expanded'), 'false');
    } finally { Reflect.deleteProperty(navigator, 'clipboard'); await view.cleanup(); }
});

test('diff previews count physical rows and still copy all rows with existing sign handling', async () => {
    const rows = ['@@ -1,7 +1,7 @@', ...Array.from({ length: 14 }, (_, i) => `${i % 2 ? '+' : '-'}const n = ${i};`)];
    const source = `\`\`\`diff js:change.js expandable lines highlight="14"\n${rows.join('\n')}\n\`\`\``;
    const view = await mount(source);
    const copied: string[] = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { copied.push(text); } } });
    try {
        assert.equal(view.container.querySelectorAll('.ink-code-diff-row').length, 12);
        await act(async () => view.container.querySelector<HTMLButtonElement>('[aria-label="Copy code"]')!.click());
        assert.deepEqual(copied, [rows.map(row => /^[+\- ]/.test(row) ? row.slice(1) : row).join('\n')]);
        await act(async () => view.container.querySelector<HTMLButtonElement>('.ink-code-expand-button')!.click());
        assert.equal(view.container.querySelectorAll('.ink-code-diff-row').length, 15);
        assert.equal(view.container.querySelectorAll('.ink-code-diff-add').length, 7);
        assert.equal(view.container.querySelectorAll('.ink-code-diff-remove').length, 7);
        assert.equal(view.container.querySelectorAll('.ink-code-line-highlighted').length, 1);
    } finally { Reflect.deleteProperty(navigator, 'clipboard'); await view.cleanup(); }
});

test('user expansion survives streaming append, while short blocks have no toggle', async () => {
    const view = await mount(fence('expandable', 12));
    try {
        const update = async (count: number) => act(async () => view.root.render(createElement(InkstreamMarkdown, {
            children: fence('expandable', count), streaming: true,
        })));
        await update(13);
        const button = view.container.querySelector<HTMLButtonElement>('.ink-code-expand-button')!;
        assert.equal(button.getAttribute('aria-expanded'), 'false');
        await act(async () => button.click());
        await update(20);
        assert.equal(view.container.querySelector('pre code')?.textContent, code(20));
        assert.equal(button.getAttribute('aria-expanded'), 'true');
        await update(5);
        assert.equal(view.container.querySelector('.ink-code-expand-button'), null);
        assert.equal(view.container.querySelector('pre code')?.textContent, code(5));
    } finally { await view.cleanup(); }
});

test('CodeGroup switching retains each example expansion independently', async () => {
    const source = `<CodeGroup>\n${fence('title="A" expandable')}\n\n${fence('title="B" expandable')}\n</CodeGroup>`;
    const view = await mount(source);
    try {
        const buttons = [...view.container.querySelectorAll<HTMLButtonElement>('.ink-code-expand-button')];
        const tabs = [...view.container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
        await act(async () => buttons[0].click());
        await act(async () => tabs[1].click());
        assert.equal(buttons[1].getAttribute('aria-expanded'), 'false');
        await act(async () => tabs[0].click());
        assert.equal(buttons[0].getAttribute('aria-expanded'), 'true');
    } finally { await view.cleanup(); }
});

test('collapsed SSR hydrates without mismatches and can then expand', async () => {
    const source = fence('title="Hydrate.js" lines expandable');
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
        await act(async () => container.querySelector<HTMLButtonElement>('.ink-code-expand-button')!.click());
        assert.equal(container.querySelector('pre code')?.textContent, code(15));
    } finally { await act(async () => root.unmount()); container.remove(); }
});

test('Shiki preview matches full-source tokens across multiline constructs at the cutoff', async () => {
    const { getHighlighter, tokenizeLines } = await import('../src/react/shiki.js');
    const highlighter = await getHighlighter();
    assert.ok(highlighter, 'the installed Shiki dependency must load');
    const samples = [
        { language: 'typescript', lines: ['const message = `', ...Array.from({ length: 12 }, (_, i) => `line ${i}`), '`;', 'console.log(message);'] },
        { language: 'typescript', lines: ['/* comment', ...Array.from({ length: 12 }, (_, i) => `line ${i}`), '*/', 'const value = 1;'] },
        { language: 'tsx', lines: ['const node = <Component', ...Array.from({ length: 12 }, (_, i) => `  prop${i}="value"`), '/>;'] },
        { language: 'python', lines: ['message = """', ...Array.from({ length: 12 }, (_, i) => `line ${i}`), '"""', 'print(message)'] },
        { language: 'bash', lines: ['cat <<EOF', ...Array.from({ length: 12 }, (_, i) => `line ${i}`), 'EOF', 'echo done'] },
    ];
    for (const { language, lines } of samples) {
        const preview = tokenizeLines(highlighter, lines.slice(0, 12).join('\n'), language);
        const full = tokenizeLines(highlighter, lines.join('\n'), language);
        assert.ok(preview, language);
        assert.ok(full, language);
        assert.deepEqual(preview, full.slice(0, 12), language);
    }
});
