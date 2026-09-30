import assert from 'node:assert/strict';
import test from 'node:test';
import type { Image, Paragraph, Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';
import { remarkHtmlImages } from '../src/remark-html-images.js';

const processor = unified().use(remarkParse).use(remarkHtmlImages);

function parse(markdown: string): Root {
    return processor.runSync(
        processor.parse(normalizeInkstreamMarkdown(markdown)),
    ) as Root;
}

function images(markdown: string): Image[] {
    const found: Image[] = [];
    const walk = (node: { type: string; children?: unknown[] }) => {
        if (node.type === 'image') {
            found.push(node as Image);
        }

        for (const child of node.children ?? []) {
            walk(child as typeof node);
        }
    };

    walk(parse(markdown));

    return found;
}

test('converts a self-closing image and keeps width and height', () => {
    const [image] = images(
        '<img src="https://example.com/example.jpg" alt="Example" width="100" height="56" />',
    );

    assert.equal(image.url, 'https://example.com/example.jpg');
    assert.equal(image.alt, 'Example');
    assert.deepEqual(image.data?.hProperties, { width: 100, height: 56 });
});

test('converts the non-self-closing form and images inside a sentence', () => {
    assert.equal(images('<img src="/a.png" alt="A">').length, 1);
    assert.equal(images('a <img src="/x.png" alt="x" /> b').length, 1);
});

test('a standalone image is wrapped in a paragraph', () => {
    const tree = parse('<img src="/a.png" alt="A" />');
    const paragraph = tree.children[0] as Paragraph;

    assert.equal(paragraph.type, 'paragraph');
    assert.equal(paragraph.children[0].type, 'image');
});

test('converts consecutive image lines that share one html node', () => {
    const found = images('<img src="/a.png" alt="A" />\n<img src="/b.png" alt="B" />');

    assert.deepEqual(
        found.map((image) => image.url),
        ['/a.png', '/b.png'],
    );
});

test('converts an image inside a link, HTML or Markdown', () => {
    assert.equal(images('<a href="/x"><img src="/a.png" alt="A" /></a>').length, 1);
    assert.equal(images('[<img src="/a.png" alt="A" />](/x)').length, 1);
});

test('reads only positive integer dimensions', () => {
    const [width] = images('<img src="/a.png" width="120" />');

    assert.deepEqual(width.data?.hProperties, { width: 120 });

    for (const dims of ['width="100%"', 'height="10px"', 'width="0"', 'width="auto"', 'width="{5}"']) {
        assert.equal(images(`<img src="/a.png" ${dims} />`)[0].data, undefined, dims);
    }
});

test('decodes entities in src and alt, and allows > inside quotes', () => {
    const [image] = images('<img src="https://e.com/i.png?a=1&amp;b=2" alt="a > b &amp; c" />');

    assert.equal(image.url, 'https://e.com/i.png?a=1&b=2');
    assert.equal(image.alt, 'a > b & c');
});

test('never reads class, style, srcset, loading, data-*, or event handlers', () => {
    const [image] = images(
        '<img src="/a.png" alt="A" class="c" className="c" style="x:y" onerror="alert(1)" onload="x()" data-path="p" srcset="a 2x" loading="lazy" />',
    );

    assert.equal(image.url, '/a.png');
    assert.equal(image.data, undefined);
    assert.equal(/onerror|onload|srcset|style/.test(JSON.stringify(image)), false);
});

test('accepts http, https and relative sources', () => {
    for (const src of ['http://e.com/a.png', 'https://e.com/a.png', '/a.png', 'a/b.png', '../a.png']) {
        assert.equal(images(`<img src="${src}" />`).length, 1, src);
    }
});

test('rejects dangerous or unsupported sources, however they are hidden', () => {
    for (const src of [
        'javascript:alert(1)',
        'javascript&colon;alert(1)',
        'java&#9;script:alert(1)',
        'data:image/svg+xml;base64,AAAA',
        'ftp://x/a.png',
        'file:///etc/passwd',
        'mailto:a@b.c',
        '',
    ]) {
        assert.equal(images(`<img src="${src}" alt="x" />`).length, 0, src);
    }
});

test('leaves tags without a usable src literal', () => {
    for (const source of ['<img alt="x" />', '<img src={"/a.png"} alt="x" />', '<img />']) {
        assert.equal(images(source).length, 0, source);
    }
});

test('does not convert images in code fences or inline code', () => {
    assert.equal(images('```\n<img src="/a.png" />\n```').length, 0);
    assert.equal(images('use `<img src="/a.png" />` here').length, 0);
});
