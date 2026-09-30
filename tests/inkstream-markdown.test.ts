import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Components } from 'react-markdown';
import { InkstreamMarkdown } from '../src/react/index.js';

function render(markdown: string): string {
    return renderToStaticMarkup(
        createElement(InkstreamMarkdown, null, markdown),
    );
}

test('renders plain markdown inside the ink-markdown wrapper', () => {
    const html = render('# Hello\n\nworld');

    assert.match(html, /<div class="ink-markdown">/);
    assert.match(html, /<h1 id="hello" class="ink-heading">Hello/);
    assert.match(html, /<p>world<\/p>/);
});

test('renders Mintlify callouts with variant classes', () => {
    const html = render('<Note>\nheads up\n</Note>');

    assert.match(html, /<aside class="ink-callout ink-callout-note">/);
    assert.match(html, /heads up/);
});

test('renders zenn message shorthand through the same callout renderer', () => {
    const html = render(':::message alert\ndanger\n:::');

    assert.match(html, /<aside class="ink-callout ink-callout-alert">/);
});

test('renders cards, card groups, and tree fences', () => {
    const html = render(
        [
            '<CardGroup cols={2}>',
            '  <Card title="Alpha" href="/alpha">',
            '  Body',
            '  </Card>',
            '</CardGroup>',
            '',
            '```tree',
            'src/',
            '  index.ts',
            '```',
        ].join('\n'),
    );

    assert.match(html, /<div class="ink-card-group" data-cols="2">/);
    assert.match(html, /<a href="\/alpha" class="ink-card-link">/);
    assert.match(html, /<p class="ink-card-title">Alpha<\/p>/);
    assert.match(html, /<ul class="ink-tree">/);
    assert.match(html, /<li class="ink-tree-file">index.ts<\/li>/);
});

test('renders Columns with a default renderer', () => {
    const html = render(
        ['<Columns cols={2}>', '  Left', '', '  Right', '</Columns>'].join(
            '\n',
        ),
    );

    assert.match(html, /<div class="ink-columns" data-cols="2">/);
    assert.match(html, /Left/);
    assert.match(html, /Right/);
});

test('renders a Lucide icon placeholder in Card and Accordion titles', () => {
    const html = render(
        [
            '<Card title="Alpha" icon="blocks">',
            '  Body',
            '</Card>',
            '',
            '<Accordion title="Beta" icon="search">',
            '  Inside',
            '</Accordion>',
        ].join('\n'),
    );

    assert.match(
        html,
        /<p class="ink-card-title"><span class="ink-icon" aria-hidden="true" data-icon="blocks"><\/span>Alpha<\/p>/,
    );
    assert.match(
        html,
        /<summary class="ink-accordion-title"><span class="ink-icon" aria-hidden="true" data-icon="search"><\/span>Beta<\/summary>/,
    );
});

test('renders no icon for an unknown icon name', () => {
    const html = render(
        [
            '<Card title="Alpha" icon="not-a-real-icon">',
            '  Body',
            '</Card>',
        ].join('\n'),
    );

    assert.doesNotMatch(html, /ink-icon/);
    assert.match(html, /<p class="ink-card-title">Alpha<\/p>/);
});

test('styles lay out Columns and CardGroup by their cols', () => {
    const css = readFileSync(
        new URL('../src/react/styles.css', import.meta.url),
        'utf8',
    );

    assert.match(css, /\.ink-card-group, \.ink-columns \{[^}]*display: grid/);
    assert.match(css, /\[data-cols="3"\]/);
    assert.match(css, /\[data-cols="4"\]/);
});

test('renders zenn image size and caption metadata', () => {
    const html = render('![diagram](/img/a.png =250x)\n*a caption*');

    assert.match(html, /<img src="\/img\/a\.png" alt="diagram" width="250"/);
    assert.match(html, /<span class="ink-figure-caption">a caption<\/span>/);
});

test('component overrides replace individual default renderers', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: '<Note>\nbody\n</Note>',
            components: {
                aside: () => createElement('p', null, 'custom'),
            } as Components,
        }),
    );

    assert.match(html, /<p>custom<\/p>/);
    assert.doesNotMatch(html, /ink-callout/);
});

test('appends extra class names to the wrapper', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: 'hi',
            className: 'prose',
        }),
    );

    assert.match(html, /<div class="ink-markdown prose">/);
});

const fieldCount = (html: string): number =>
    html.match(/class="ink-api-field"/g)?.length ?? 0;

test('API fields whose quoted type contains ">" render as fields', () => {
    const html = render(
        [
            '<ParamField body="questions" type="map<string, Question>" required>',
            '  A map of questions. See [Question](#question-types).',
            '</ParamField>',
            '',
            '<ResponseField name="legend" type="map<string, string>" required>',
            '  A map of level descriptions.',
            '</ResponseField>',
            '',
            '<ParamField body="x" type="array<string | object | array>">',
            '  Union.',
            '</ParamField>',
            '',
            '<ParamField body="simple" type="string">',
            '  Control.',
            '</ParamField>',
            '',
            '<ResponseField name="self" type="map<string, string>" required />',
        ].join('\n'),
    );

    assert.equal(fieldCount(html), 5);
    assert.doesNotMatch(html, /&lt;\/?(?:ParamField|ResponseField)/);
    assert.match(
        html,
        /<span class="ink-api-field-type">map&lt;string, Question&gt;<\/span>/,
    );
    assert.match(html, /<a href="#question-types">Question<\/a>/);
});

test('a generic-typed field can contain another field', () => {
    const html = render(
        [
            '<ParamField body="outer" type="map<string, object>">',
            '  <ParamField body="inner" type="array<string>">',
            '    Inner.',
            '  </ParamField>',
            '</ParamField>',
        ].join('\n'),
    );

    assert.equal(fieldCount(html), 2);
});

test('generic field tags inside a fenced code block stay code', () => {
    const html = render(
        [
            '```markdown',
            '<ParamField body="q" type="map<string, Question>" required>',
            '  text',
            '</ParamField>',
            '```',
        ].join('\n'),
    );

    assert.equal(fieldCount(html), 0);
    assert.match(html, /ParamField body=/);
});
