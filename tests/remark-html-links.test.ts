import assert from 'node:assert/strict';
import test from 'node:test';
import type { Link, Paragraph, Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';
import { remarkHtmlLinks } from '../src/remark-html-links.js';

const processor = unified().use(remarkParse).use(remarkHtmlLinks);

function links(markdown: string): Link[] {
    const tree = processor.runSync(
        processor.parse(normalizeInkstreamMarkdown(markdown)),
    ) as Root;
    const found: Link[] = [];
    const walk = (node: { type: string; children?: unknown[] }) => {
        if (node.type === 'link') {
            found.push(node as Link);
        }

        for (const child of node.children ?? []) {
            walk(child as typeof node);
        }
    };

    walk(tree);

    return found;
}

const text = (link: Link): string =>
    link.children.map((child) => ('value' in child ? child.value : '')).join('');

test('converts a plain link and drops class/rel/other attributes', () => {
    const [link] = links(
        '<a href="https://example.com/p#share/x" rel="noreferrer" className="text-primary">Try this example</a>',
    );

    assert.equal(link.url, 'https://example.com/p#share/x');
    assert.equal(text(link), 'Try this example');
    assert.equal(link.data, undefined);
});

test('target=_blank always gets noopener noreferrer', () => {
    const [link] = links('<a href="/x" target="_blank" rel="opener">t</a>');

    assert.deepEqual(link.data?.hProperties, {
        target: '_blank',
        rel: ['noopener', 'noreferrer'],
    });
});

test('other targets are dropped', () => {
    const [link] = links('<a href="/x" target="_top">t</a>');

    assert.equal(link.data, undefined);
});

test('keeps a title and decodes entities in the URL once', () => {
    const [link] = links('<a href="https://e.com/?a=1&amp;b=2" title="Tip">q</a>');

    assert.equal(link.url, 'https://e.com/?a=1&b=2');
    assert.equal(link.title, 'Tip');
});

test('keeps inline Markdown in the label', () => {
    const [link] = links('<a href="/x">**bold** and `code`</a>');

    assert.deepEqual(
        link.children.map((child) => child.type),
        ['strong', 'text', 'inlineCode'],
    );
});

test('converts links inline in a sentence, a list item, and a heading', () => {
    assert.equal(links('See <a href="/a">here</a> now.').length, 1);
    assert.equal(links('- item <a href="/a">link</a>').length, 1);
    assert.equal(links('## Title <a href="/a">link</a>').length, 1);
});

test('converts a multi-line link with a plain-text label', () => {
    const [link] = links('<a href="/x">\nMulti line\nlabel\n</a>');

    assert.equal(text(link), 'Multi line label');
});

test('accepts fragment, relative, https and mailto URLs', () => {
    for (const href of ['#sec', '/docs/x', '../up', 'https://e.com', 'mailto:a@b.c']) {
        assert.equal(links(`<a href="${href}">x</a>`).length, 1, href);
    }
});

test('rejects dangerous or unsupported URLs, however they are hidden', () => {
    for (const href of [
        'javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'javascript&colon;alert(1)',
        'java&#9;script:alert(1)',
        'data:text/html;base64,AAAA',
        'vbscript:x',
        'tel:+81',
        '',
    ]) {
        assert.equal(links(`<a href="${href}">x</a>`).length, 0, href);
    }
});

test('never reads event handlers or style', () => {
    const [link] = links('<a href="/x" onclick="alert(1)" style="color:red">t</a>');

    assert.equal(link.url, '/x');
    assert.equal(link.data, undefined);
    assert.equal(JSON.stringify(link).includes('onclick'), false);
});

test('leaves tags it cannot treat as an ordinary link literal', () => {
    for (const source of [
        '<a class="x">label</a>',
        '<a href={"/x"}>t</a>',
        '<a href="/x"></a>',
        'text <a href="/x"> no close',
        '<a id="x" href="/y"></a>',
    ]) {
        assert.equal(links(source).length, 0, source);
    }
});

test('does not convert links in code fences or inline code', () => {
    assert.equal(links('```\n<a href="/x">no</a>\n```').length, 0);
    assert.equal(links('use `<a href="/x">no</a>` here').length, 0);
});

test('a flow-level link is wrapped in a paragraph', () => {
    const tree = processor.runSync(
        processor.parse(normalizeInkstreamMarkdown('<a href="/x">\nLabel\n</a>')),
    ) as Root;
    const paragraph = tree.children[0] as Paragraph;

    assert.equal(paragraph.type, 'paragraph');
    assert.equal(paragraph.children[0].type, 'link');
});
