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

test('opt-in pipeline parses Checkbox, Select, and nested Option tags', () => {
    const { tree, messages } = parse(
        [
            '<Checkbox id="alerts" label="Alerts" default="true" />',
            '',
            '<Select id="period" label="Period" default="week">',
            '<Option value="day">',
            'Daily',
            '</Option>',
            '',
            '<Option value="week">',
            'Weekly',
            '</Option>',
            '</Select>',
        ].join('\n'),
        true,
    );
    const output = JSON.stringify(tree);

    assert.match(output, /"tagName":"checkbox"/);
    assert.match(output, /"tagName":"select"/);
    assert.equal((output.match(/"tagName":"option"/g) ?? []).length, 2);
    assert.match(output, /"value":"week"/);
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

test('invalid Slider ranges and numeric attributes produce diagnostics', () => {
    const { messages } = parse(
        '<Slider id="bad-range" min="10" max="10" />\n\n<Slider id="bad-step" min="0" max="10" step="0" />\n\n<Slider id="bad-min" min="oops" max="10" />',
        true,
    );

    assert.ok(
        messages.includes(
            '<Slider> requires min to be less than max; the slider was hidden',
        ),
    );
    assert.ok(
        messages.includes(
            '<Slider> requires step to be greater than 0; the slider was hidden',
        ),
    );
    assert.ok(
        messages.includes(
            'Invalid or unsupported attribute "min" on <Slider>; the attribute was ignored',
        ),
    );
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

test('Input is opt-in, keeps safe attributes in nested AST, and diagnoses invalid attributes', () => {
    const source = '<Card title="Search">\n<Input id="query" label="検索" default="日本語" placeholder="キーワード" />\n</Card>';
    const { tree, messages } = parse(source, true);
    assert.match(JSON.stringify(tree), /"tagName":"input"/);
    assert.match(JSON.stringify(tree), /"placeholder":"キーワード"/);
    assert.deepEqual(messages, []);
    assert.doesNotMatch(JSON.stringify(parse(source, false).tree), /"tagName":"input"/);
    const invalid = parse('<Input id="bad id" onChange="alert(1)" type="password" />', true);
    assert.equal(invalid.messages.length, 3);
    assert.doesNotMatch(JSON.stringify(invalid.tree), /alert\(1\)|password|bad id/);
});

test('Form validates attributes and diagnoses duplicate IDs and nested forms', () => {
    const source = '<Form id="settings" action="save" method="post" onSubmit="alert(1)">\n<Input id="same" />\n\n<Input id="same" />\n\n<Form id="inner" action="save">\n</Form>\n</Form>';
    const result = parse(source, true);
    assert.match(JSON.stringify(result.tree), /"tagName":"form"/);
    assert.ok(result.messages.some(m => m.includes('Duplicate input id')));
    assert.ok(result.messages.some(m => m.includes('Nested <Form>')));
    assert.equal(result.messages.filter(m => m.includes('Invalid or unsupported attribute')).length, 2);
    assert.doesNotMatch(JSON.stringify(result.tree), /alert\(1\)|"method"/);
    assert.doesNotMatch(JSON.stringify(parse(source, false).tree), /"tagName":"form"/);
    assert.ok(parse('<Form id="missing-action">\n</Form>', true).messages.some(m => m.includes('requires valid id and action')));
});
