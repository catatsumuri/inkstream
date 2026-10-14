import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Components } from 'react-markdown';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';
import {
    generativeUiRemarkPlugins,
    inkstreamRemarkPlugins,
    normalizeGenerativeUiMarkdown,
    normalizeInkstreamMarkdown,
} from '../src/index.js';
import { InkstreamMarkdown } from '../src/react/index.js';

const example = [
    '<Box padding="2">',
    '<Card title="Security review">',
    '<Column align="start" gap="2">',
    '<Row align="center" gap="3">',
    '<Icon name="shield-check" />',
    '<Badge color="green">Complete</Badge>',
    '</Row>',
    '</Column>',
    '</Card>',
    '</Box>',
].join('\n');

function parse(source: string, generativeUi: boolean) {
    const normalized = normalizeInkstreamMarkdown(source, { generativeUi });
    const file = new VFile(normalized);
    const plugins = generativeUi
        ? generativeUiRemarkPlugins
        : inkstreamRemarkPlugins;
    const processor = unified()
        .use(remarkParse)
        .use(plugins)
        .use(remarkRehype);
    const tree = processor.runSync(processor.parse(file), file);

    return { tree, messages: file.messages.map((message) => message.reason) };
}

test('opt-in pipeline parses nested static UI tags and retains Markdown tags', () => {
    const { tree, messages } = parse(example, true);
    const output = JSON.stringify(tree);

    assert.match(output, /"tagName":"row"/);
    assert.match(output, /"tagName":"column"/);
    assert.match(output, /"tagName":"box"/);
    assert.match(output, /"padding":"2"/);
    assert.match(output, /"align":"center"/);
    assert.match(output, /"gap":"3"/);
    assert.match(output, /"tagName":"icon"/);
    assert.match(output, /"tagName":"badge"/);
    assert.deepEqual(messages, []);
});

test('default pipeline leaves Generative UI tags inactive', () => {
    const { tree, messages } = parse('<Row gap="3">content</Row>', false);
    const output = JSON.stringify(tree);

    assert.doesNotMatch(output, /ink-ui-row/);
    assert.match(messages.join('\n'), /Row.*not a supported component/);
});

test('opt-in schema drops unsupported attributes and invalid values', () => {
    const { tree, messages } = parse(
        '<Row gap="999" justify="around" onClick="run()">content</Row>',
        true,
    );
    const output = JSON.stringify(tree);

    assert.doesNotMatch(output, /"gap":"999"/);
    assert.doesNotMatch(output, /"onClick"/);
    assert.match(output, /"justify":"around"/);
    assert.equal(messages.length, 2);
    assert.ok(messages.every((message) => message.includes('ignored')));
});

test('React renderer displays the static UI profile with safe spacing', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            generativeUi: true,
            children: example,
        }),
    );

    assert.match(html, /class="ink-ui-row"/);
    assert.match(html, /class="ink-ui-column"/);
    assert.match(html, /class="ink-ui-box" style="padding:0\.5rem"/);
    assert.match(html, /data-align="center"/);
    assert.match(html, /style="gap:0\.75rem"/);
    assert.match(html, /class="ink-ui-icon"/);
    assert.match(html, /class="ink-badge ink-badge-green"/);
    assert.match(html, /class="ink-card"/);
});

test('Generative UI SSR preserves clock times in UI content', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            generativeUi: true,
            children:
                '<Card title="Incident">Started 09:12; recovered at 09:40.</Card>',
        }),
    );

    assert.match(html, /Started 09:12; recovered at 09:40\./);
});

test('custom UI renderers receive validated attributes only', () => {
    let received: Record<string, unknown> | undefined;
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            generativeUi: true,
            children: '<Row gap="999" onClick="run()">body</Row>',
            components: {
                row: (props: Record<string, unknown> & { children?: ReactNode }) => {
                    received = props;

                    return createElement('div', null, props.children);
                },
            } as Components,
        }),
    );

    assert.equal(received?.gap, undefined);
    assert.equal(received?.onClick, undefined);
    assert.match(html, /body/);
});

test('default normalizer output is unchanged and opt-in normalizer recognizes UI blocks', () => {
    assert.equal(normalizeInkstreamMarkdown('<Row>\nx\n</Row>'), '<Row>\nx\n</Row>');
    assert.notEqual(normalizeGenerativeUiMarkdown('<Row>\nx\n</Row>'), '<Row>\nx\n</Row>');
});
