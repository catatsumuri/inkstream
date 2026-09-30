import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHtmlHeadings } from '../src/normalize-html-headings.js';

test('converts a single-line heading with an id', () => {
    assert.equal(
        normalizeHtmlHeadings('<h3 id="a.b_c">Quick start</h3>'),
        '### Quick start {#a.b_c}',
    );
});

test('converts a multi-line heading and preserves the line count', () => {
    const source = '<h2 id="quickstart">\n  Quickstart\n</h2>\nafter';
    const result = normalizeHtmlHeadings(source);

    assert.equal(result, '## Quickstart {#quickstart}\n\n\nafter');
    assert.equal(result.split('\n').length, source.split('\n').length);
});

test('maps h1 to h6 onto ATX levels', () => {
    for (let level = 1; level <= 6; level++) {
        assert.equal(
            normalizeHtmlHeadings(`<h${level}>T</h${level}>`),
            `${'#'.repeat(level)} T`,
        );
    }
});

test('keeps inline markdown and entities as authored', () => {
    assert.equal(
        normalizeHtmlHeadings('<h2 id="f">Use `pip` &amp; **bold**</h2>'),
        '## Use `pip` &amp; **bold** {#f}',
    );
});

test('accepts single-quoted ids and preserves leading indentation', () => {
    assert.equal(
        normalizeHtmlHeadings("  <h2 id='x'>T</h2>"),
        '  ## T {#x}',
    );
});

test('drops every attribute except a safe id', () => {
    assert.equal(
        normalizeHtmlHeadings(
            '<h2 id="x" class="big" style="color:red" onclick="alert(1)">T</h2>',
        ),
        '## T {#x}',
    );
    assert.equal(normalizeHtmlHeadings('<h2 className="c">T</h2>'), '## T');
});

test('ignores an unsafe id but still converts the heading', () => {
    for (const id of ['a b', 'a"b', '-x', '', 'a/b']) {
        assert.equal(
            normalizeHtmlHeadings(`<h2 id='${id}'>T</h2>`),
            '## T',
            `id ${JSON.stringify(id)}`,
        );
    }
});

test('escapes a trailing # run so it is not an ATX closing sequence', () => {
    assert.equal(normalizeHtmlHeadings('<h2>Issue #</h2>'), '## Issue \\#');
});

test('leaves anything that is not one clean heading untouched', () => {
    for (const source of [
        '<h2 id="z">T</h2> trailing',
        '<h2 id="z">T\n\nnext paragraph',
        '<h2 id="z">T\n\nmore</h2>',
        '<h2 id="e"></h2>',
        '<h2 id="e">   </h2>',
        '<h2 id="m">T</h3>',
        '<h7>T</h7>',
        '<hr>',
        '    <h2>indented code</h2>',
        'text <h2>inline</h2> text',
    ]) {
        assert.equal(normalizeHtmlHeadings(source), source, source);
    }
});

test('leaves code fences and inline code untouched', () => {
    const fenced = '```html\n<h2 id="no">X</h2>\n```';
    const tilde = '~~~\n<h2>X</h2>\n~~~';
    const inline = 'text `<h2 id="no">X</h2>` text';

    for (const source of [fenced, tilde, inline]) {
        assert.equal(normalizeHtmlHeadings(source), source);
    }
});

test('converts a heading after a closed fence', () => {
    assert.equal(
        normalizeHtmlHeadings('```\ncode\n```\n<h2 id="y">Y</h2>'),
        '```\ncode\n```\n## Y {#y}',
    );
});
