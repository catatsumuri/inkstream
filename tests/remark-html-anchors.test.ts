import assert from 'node:assert/strict';
import test from 'node:test';
import type { Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';
import { remarkHtmlAnchors } from '../src/remark-html-anchors.js';

const processor = unified().use(remarkParse).use(remarkHtmlAnchors);

function parse(markdown: string): Root {
    const source = normalizeInkstreamMarkdown(markdown);

    return processor.runSync(processor.parse(source)) as Root;
}

const ids = (tree: Root): string[] => {
    const found: string[] = [];
    const walk = (node: { type: string; children?: unknown[]; data?: unknown }) => {
        if (node.type === 'htmlAnchor') {
            found.push(
                (node.data as { hProperties: { id: string } }).hProperties.id,
            );
        }

        for (const child of node.children ?? []) {
            walk(child as typeof node);
        }
    };

    walk(tree);

    return found;
};

test('converts a self-closing anchor into a target', () => {
    const tree = parse('<a id="sdk-constructor" />\n\n### Constructor');

    assert.deepEqual(ids(tree), ['sdk-constructor']);
    assert.deepEqual(
        tree.children.map((node) => node.type),
        ['htmlAnchor', 'heading'],
    );
});

test('converts a paired empty anchor and the name= form', () => {
    assert.deepEqual(ids(parse('<a id="x"></a>')), ['x']);
    assert.deepEqual(ids(parse('<a name="legacy"></a>')), ['legacy']);
    assert.deepEqual(ids(parse("<a id='sq' />")), ['sq']);
});

test('converts consecutive anchor lines that share one html node', () => {
    assert.deepEqual(ids(parse('<a id="a1" />\n<a id="a2" />\n<a id="a3"></a>')), [
        'a1',
        'a2',
        'a3',
    ]);
});

test('converts an anchor inside a paragraph, keeping the text', () => {
    const tree = parse('before <a id="mid" /> after');
    const paragraph = tree.children[0] as { type: string; children: { type: string }[] };

    assert.equal(paragraph.type, 'paragraph');
    assert.deepEqual(
        paragraph.children.map((node) => node.type),
        ['text', 'htmlAnchor', 'text'],
    );
});

test('accepts dots, underscores and colons in ids', () => {
    assert.deepEqual(ids(parse('<a id="mod.Class_method:v2" />')), [
        'mod.Class_method:v2',
    ]);
});

test('leaves anchors with other attributes alone', () => {
    for (const source of [
        '<a id="x" href="/y"></a>',
        '<a id="x" onclick="alert(1)" />',
        '<a href="/y">label</a>',
        '<a id="x">label</a>',
    ]) {
        assert.deepEqual(ids(parse(source)), [], source);
    }
});

test('rejects unsafe or empty ids', () => {
    for (const source of ['<a id="" />', '<a id="a b" />', '<a id="a&b" />']) {
        assert.deepEqual(ids(parse(source)), [], source);
    }
});

test('leaves anchors in code fences and inline code untouched', () => {
    assert.deepEqual(ids(parse('```\n<a id="no" />\n```')), []);
    assert.deepEqual(ids(parse('use `<a id="no" />` here')), []);
});

test('an anchor-only paragraph does not leave an empty paragraph', () => {
    const tree = parse('<a id="x"></a>\n\ntext');

    assert.deepEqual(
        tree.children.map((node) => node.type),
        ['htmlAnchor', 'paragraph'],
    );
});
