import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement, act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { normalizeInkstreamMarkdown } from '../src/index.js';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';
import { InkstreamMarkdown } from '../src/react/index.js';

const render = (source: string) => renderToStaticMarkup(createElement(InkstreamMarkdown, { children: source }));
const card = '<Card\n  title="Docs"\n  icon="rocket"\n  href="/docs"\n>\n**Body**\n</Card>';

test('multiline openings render like their single-line equivalent, including self-closing tags', () => {
    const single = '<Card title="Docs" icon="rocket" href="/docs">\n**Body**\n</Card>';
    assert.equal(render(card), render(single));
    assert.match(render('<Card\n  title="Docs"\n  href="/docs"\n/>'), /href="\/docs"/);
    assert.match(render('<Card title="Docs"\n  href="/docs">\nBody\n</Card>'), /href="\/docs"/);
    assert.match(render('<Note\n>\nBody\n</Note>'), /ink-callout-note/);
});

test('generic types, entities, arrays, numbers, and bare attributes keep existing semantics', () => {
    const source = '<ParamField\n  query="record"\n  type="map<string, X>"\n  required\n>\n<Field>\n</ParamField>';
    assert.match(render(source), /map&lt;string, X&gt;/);
    assert.match(render(source), /ink-api-field-required/);
    assert.match(render('<Card\n title="A &quot;quote&quot; > B"\n/>'), /A &quot;quote&quot; &gt; B/);
    const normalized = normalizeInkstreamMarkdown('<Update\n label="Release"\n tags={["A", "B"]}\n>\nBody\n</Update>');
    assert.match(normalized, /tags="A,B"/);
    assert.match(render('<CardGroup\n cols={3}\n>\n<Card title="One" />\n</CardGroup>'), /data-cols="3"/);
});

test('multiline nested tags retain body indentation and code fences', () => {
    const source = '<CardGroup\n cols="2"\n>\n  <Card\n    title="Nested"\n  >\n    Text\n\n    ```js\n    const value = 1;\n    ```\n  </Card>\n</CardGroup>';
    const html = render(source);
    assert.match(html, /Nested/);
    assert.match(html, /<p>Text<\/p>/);
    assert.match(html, /const value = 1;/);
    assert.equal((html.match(/ink-card-title/g) ?? []).length, 1);
});

test('multiline openings stay inside list items and blockquotes', () => {
    const list = '1. Install:\n\n   <Card\n     title="Docs"\n   >\n   Body\n   </Card>\n\n   After\n2. Next';
    const document = new JSDOM(render(list)).window.document;
    assert.equal(document.querySelectorAll('ol > li').length, 2);
    assert.ok(document.querySelector('ol > li > .ink-card'));
    const quoted = '> <Card\n>   title="Quote"\n> >\n>\n> Body\n>\n> </Card>';
    assert.match(render(quoted), /<blockquote>[\s\S]*ink-card/);
    assert.match(render(quoted), /Quote/);
});

test('fenced, quoted/list fenced, inline and indented code stay literal', () => {
    const literal = '<Card\n  title="Literal"\n/>';
    const sources = [
        `\`\`\`md\n${literal}\n\`\`\``,
        `~~~md\n${literal}\n~~~`,
        ['> ```md', ...literal.split('\n').map(line => `> ${line}`), '> ```'].join('\n'),
        ['- ```md', ...literal.split('\n').map(line => `  ${line}`), '  ```'].join('\n'),
        `prefix \`literal\n${literal}\nend\``,
        literal.split('\n').map(line => `    ${line}`).join('\n'),
    ];
    for (const source of sources) {
        assert.equal(normalizeMintlifyBlocks(source), source, source);
        assert.doesNotMatch(render(source), /class="ink-card"/);
    }
});

test('a quoted fence ending with its quote does not swallow subsequent multiline tags', () => {
    const source = '> ```md\n> <Card\n> title="Literal"\n> />\n\n' + card;
    const html = render(source);
    assert.equal((html.match(/class="ink-card"/g) ?? []).length, 1);
    assert.match(html, /Docs/);
});

test('incomplete, unknown, expression, and multiline-value openings are not joined', () => {
    for (const source of [
        '<Card\n title="Docs"',
        '<Unknown\n title="Docs"\n/>',
        '<Card\n title={"Docs"}\n/>',
        '<Card\n title={run()}\n/>',
        '<Card\n title="two\n lines"\n/>',
        '<Card\n\n title="Docs"\n/>',
        '<Card\n Body text is not an attribute\n>\nAfter',
        '<Card\n title="Docs"\n> trailing text',
    ]) {
        assert.equal(normalizeMintlifyBlocks(source), source, source);
    }
});

test('math content containing multiline tag examples is protected', () => {
    const source = '$$\n<Card\n  title="Math"\n/>\n$$';
    assert.equal(normalizeInkstreamMarkdown(source), source);
});

test('opt-in Generative UI accepts multiline tags only when enabled', () => {
    const source = '<Input\n id="query"\n label="Query"\n default="Initial"\n/>';
    assert.match(renderToStaticMarkup(createElement(InkstreamMarkdown, { children: source, generativeUi: true })), /value="Initial"/);
    assert.equal(normalizeInkstreamMarkdown(source), source);
});

test('streamed multiline Form stays disabled until its tags explicitly close and then hydrates', async () => {
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
    const saved = new Map(['window', 'document', 'navigator', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    Object.defineProperties(globalThis, {
        window: { value: dom.window, configurable: true }, document: { value: dom.window.document, configurable: true },
        navigator: { value: dom.window.navigator, configurable: true }, IS_REACT_ACT_ENVIRONMENT: { value: true, configurable: true },
    });
    const { createRoot, hydrateRoot } = await import('react-dom/client');
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    const start = '<Form\n id="settings"\n action="save"';
    const body = '\n>\n<Input\n id="query"\n default="initial"\n/>\n\n<Button type="submit">Save</Button>';
    const errors: unknown[] = [];
    try {
        const update = async (children: string) => act(async () => root.render(createElement(InkstreamMarkdown, {
            children, generativeUi: true, streaming: true, streamingMode: 'block',
        })));
        await update(start);
        assert.equal(container.querySelector('form'), null);
        await update(start + body);
        assert.equal(container.querySelector('fieldset')?.disabled, true);
        await update(start + body + '\n</Form>');
        assert.equal(container.querySelector('fieldset')?.disabled, false);
        assert.ok(container.querySelector('button[type="submit"]'));
        await act(async () => root.unmount());
        const source = card;
        container.innerHTML = render(source);
        let hydrated: ReturnType<typeof hydrateRoot>;
        await act(async () => { hydrated = hydrateRoot(container, createElement(InkstreamMarkdown, { children: source }), {
            onRecoverableError: error => errors.push(error),
        }); });
        assert.deepEqual(errors, []);
        await act(async () => hydrated.unmount());
    } finally {
        dom.window.close();
        for (const [key, descriptor] of saved) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else Reflect.deleteProperty(globalThis, key);
        }
    }
});


test('closed and outdented list fences preserve code and the following components', () => {
    for (const close of ['  ```\n', '']) {
        const source = '- ```md\n  <Card\n    title="Literal"\n  />\n' + close + '\n' + card;
        assert.equal((render(source).match(/class="ink-card"/g) ?? []).length, 1);
    }
    const source = '- ```md\n  <Card\n    title="Literal"\n  />\n  ```\n\n  <Card\n    title="Inside list"\n  >\n  Body\n  </Card>';
    assert.ok(new JSDOM(render(source)).window.document.querySelector('li > .ink-card'));
});

test('multiline attributes retain the same unsafe-URL filtering', () => {
    const html = render('<Card\n title="Unsafe"\n href="javascript:alert(1)"\n/>');
    assert.match(html, /Unsafe/);
    assert.doesNotMatch(html, /href="javascript:/);
});
