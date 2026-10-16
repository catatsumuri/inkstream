import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { VFile } from 'vfile';
import {
    extractMarkdownHeadings, extractPlainText, normalizeInkstreamMarkdown,
    inkstreamRemarkPlugins, inkstreamRehypePlugins,
} from '../src/index.js';
import { InkstreamMarkdown } from '../src/react/index.js';
import { runCli } from '../src/cli.js';

const render = (source: string) => renderToStaticMarkup(createElement(InkstreamMarkdown, null, source));

test('inline, block, and math fences render HTML and accessible MathML in SSR and CLI', async () => {
    for (const source of [
        'Value $x^2$ here',
        '$$\n\\frac{a}{b} + \\sum_{i=1}^n i\n$$',
        '$$\n\\begin{pmatrix}a & b \\\\ c & d\\end{pmatrix}\n$$',
        '```math\nx^2\n```',
    ]) {
        for (const html of [render(source), (await runCli(['render'], source)).output]) {
            assert.match(html, /class="katex"/);
            assert.match(html, /<math xmlns=/);
            assert.match(html, /annotation encoding="application\/x-tex"/);
            assert.doesNotMatch(html, /ink-code|data-ink-heading-text/);
        }
    }
});

test('math is preserved within supported containers and GFM tables', () => {
    for (const source of [
        '<Note>\n$x$\n</Note>',
        ':::details Title\n\n$$\nx^2\n$$\n\n:::',
        '<Tabs>\n<Tab title="Math">\n$x$\n</Tab>\n</Tabs>',
        '- $x$\n- $y$',
        '| Value |\n| --- |\n| $x$ |',
        '> $$\n> x^2\n> $$',
    ]) assert.match(render(source), /class="katex"/);
});

test('normalization preserves math contents including HTML, directives, images, and backticks', () => {
    const body = '<h2>Math</h2>\n<Note>\n:::message alert\n![](x.png =250x)\n*caption*\n```\na < b > c \\{x\\}';
    const source = `<Note>\n$$\n${body}\n$$\n</Note>`;
    assert.ok(normalizeInkstreamMarkdown(source).includes(`$$\n${body}\n$$`));
    assert.equal(normalizeInkstreamMarkdown('$a <Note>b</Note> c$'), '$a <Note>b</Note> c$');
    const multiline = '$a\n<Note>\nb$';
    assert.equal(normalizeInkstreamMarkdown(multiline), multiline);
    const nestedMultiline = `<Note>\n${multiline}\n</Note>`;
    assert.ok(normalizeInkstreamMarkdown(nestedMultiline).includes(multiline));
    assert.ok(normalizeInkstreamMarkdown('<Note>\n\n    $$\n    <Warning>\n    $$\n</Note>').includes('$$\n<Warning>\n$$'));
    assert.match(render(source), /ink-callout-note/);
    assert.equal((render(source).match(/ink-callout-note/g) ?? []).length, 1);
});

test('code, escaped dollars, and unmatched inline delimiters remain literal', () => {
    for (const source of ['`$x$`', '```js\nconst price = "$x$";\n```', '\\$5 and \\$10', 'unfinished $x']) {
        assert.doesNotMatch(render(source), /class="katex"/);
    }
});

test('invalid or unfinished math cannot abort rendering; diagnostics are available to custom pipelines', async () => {
    const source = '$\\frac{$\n\nafter';
    assert.match(render(source), /after/);
    const file = new VFile(normalizeInkstreamMarkdown(source));
    const processor = unified().use(remarkParse).use(inkstreamRemarkPlugins)
        .use(remarkRehype).use(inkstreamRehypePlugins);
    processor.runSync(processor.parse(file), file);
    assert.ok(file.messages.some(message => message.source === 'rehype-katex'));
    for (const incomplete of ['$', '$$', '$$\n\\frac{', '$x$', '$$\nx\n$$']) {
        assert.doesNotThrow(() => render(incomplete));
        assert.equal((await runCli(['render'], incomplete)).exitCode, 0);
    }
});

test('untrusted math does not create links, HTML attributes, or external images', () => {
    const html = render('$\\href{javascript:alert(1)}{click}$\n\n$\\includegraphics{https://example.com/image.png}$\n\n$\\htmlClass{injected}{x}$');
    assert.doesNotMatch(html, /href="javascript:|<img|class="injected"/);
});

test('plain text and CLI text retain TeX source without delimiters', async () => {
    const source = 'Value $x^2$ here\n\n$$\n\\frac{a}{b}\n$$';
    assert.equal(extractPlainText(source), 'Value x^2 here\n\n\\frac{a}{b}');
    assert.equal((await runCli(['text'], source)).output, extractPlainText(source));
});

test('math headings agree with the TOC, explicit IDs, prefixes, and duplicate numbering', () => {
    const source = '## Formula $a<b>c$\n\n## Formula $a<b>c$\n\n## Formula $x$ {#custom}';
    const headings = extractMarkdownHeadings(source, 'doc');
    const html = renderToStaticMarkup(createElement(InkstreamMarkdown, { headingIdPrefix: 'doc', children: source }));
    for (const heading of headings) assert.ok(html.includes(`id="${heading.id}"`), heading.id);
    assert.equal(headings[1].id, headings[0].id + '-2');
    assert.equal(headings[2].id, 'doc-custom');
    assert.deepEqual(extractMarkdownHeadings('$$\n# not a heading\n$$'), []);
    assert.doesNotMatch(html, /data-ink-heading-text/);
});

test('normalization tokens cannot collide with user text', () => {
    const source = 'INKSTREAMMATHTOKEN0END $x$ INKSTREAMMATHTOKENX0END';
    assert.equal(normalizeInkstreamMarkdown(source), source);
});

test('SSR math hydrates without mismatches and updates during streaming', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
    const saved = new Map(['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT']
        .map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    Object.defineProperties(globalThis, {
        window: { value: dom.window, configurable: true },
        document: { value: dom.window.document, configurable: true },
        navigator: { value: dom.window.navigator, configurable: true },
        IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true },
    });
    const { act } = await import('react');
    const { hydrateRoot } = await import('react-dom/client');
    const container = dom.window.document.getElementById('root')!;
    const source = '## Formula $x^2$\n\n$$\n\\frac{a}{b}\n$$';
    container.innerHTML = render(source);
    const before = container.innerHTML;
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
        await act(async () => {
            root = hydrateRoot(container, createElement(InkstreamMarkdown, null, source), {
                onRecoverableError: error => errors.push(error),
            });
        });
        assert.deepEqual(errors, []);
        assert.equal(container.innerHTML, before);
        for (const children of ['$', '$x', '$x^2$', '$$\n\\frac{', '$$\n\\frac{1}{2}\n$$']) {
            await act(async () => {
                root!.render(createElement(InkstreamMarkdown, { streaming: true, children }));
            });
        }
        assert.match(container.innerHTML, /class="katex-display"/);
        assert.match(container.innerHTML, /\\frac\{1\}\{2\}/);
    } finally {
        await act(async () => root?.unmount());
        dom.window.close();
        for (const [key, descriptor] of saved) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    }
});
