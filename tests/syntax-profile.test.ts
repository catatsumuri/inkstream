import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InkstreamMarkdown } from '../src/react/inkstream-markdown.js';
import { resolveZennEmbed } from '../src/zenn-embeds.js';
import { normalizeZennFootnotes } from '../src/normalize-zenn-footnotes.js';

function render(children: string, syntax: 'basic' | 'zenn' | 'all') {
    return renderToStaticMarkup(
        createElement(InkstreamMarkdown, { children, syntax }),
    );
}

test('Zenn includes Markdown, GFM, math and native directives but excludes Mintlify and extensions', () => {
    const content =
        '# Heading\n\n**bold** ~~old~~\n\n:::message\nhello\n:::\n\n<Note>mintlify</Note>\n\n```quiz\nquestion: Test\nA: One\nB: Two\ncorrect: A\n```\n\n$x^2$';
    const zenn = render(content, 'zenn');
    assert.match(zenn, /<strong>bold/);
    assert.match(zenn, /<del>old/);
    assert.match(zenn, /<aside/);
    assert.match(zenn, /katex/);
    assert.doesNotMatch(zenn, /ink-quiz/);
    assert.match(zenn, /&lt;Note&gt;mintlify&lt;\/Note&gt;/);
    assert.match(zenn, /language-quiz|question: Test/);
    const basic = render(content, 'basic');
    assert.doesNotMatch(basic, /<aside|<del>|class="katex/);
    assert.match(render('<Note>hello</Note>', 'all'), /<aside/);
});

test('Zenn inline footnotes preserve formatting, fenced examples and code spans', () => {
    const source =
        'Text^[a **bold** note]. `^[literal]`\n\n```md\n^[literal]\n```';
    const html = render(source, 'zenn');
    assert.match(html, /data-footnote-ref/);
    assert.match(html, /<strong>bold/);
    assert.match(html, /\^\[literal\]/);
    assert.equal(normalizeZennFootnotes('`^[literal]`'), '`^[literal]`');
});

for (const [type, value] of [
    ['youtube', 'WRVsOCh907o'],
    ['slideshare', 'abc123'],
    ['speakerdeck', 'abc123?slide=24'],
    ['codepen', 'https://codepen.io/example/pen/abc'],
    ['jsfiddle', 'https://jsfiddle.net/example/abc/'],
    ['codesandbox', 'https://codesandbox.io/embed/example'],
    ['stackblitz', 'https://stackblitz.com/edit/example'],
    ['figma', 'https://www.figma.com/design/example'],
    ['blueprintue', 'https://blueprintue.com/render/example/'],
    ['docswell', 'https://www.docswell.com/s/user/LK7J5V-hello#p13'],
    ['tweet', 'https://x.com/jack/status/20?conversation=none'],
]) {
    test(`Zenn renders ${type} embeds and leaves code examples literal`, () => {
        assert.ok(resolveZennEmbed(type, value));
        assert.match(render(`@[${type}](${value})`, 'zenn'), /<iframe/);
        assert.doesNotMatch(
            render('```md\n' + `@[${type}](${value})` + '\n```', 'zenn'),
            /<iframe/,
        );
        assert.doesNotMatch(render(`@[${type}](${value})`, 'basic'), /<iframe/);
    });
}

test('provider validation rejects untrusted iframe origins and credentials', () => {
    for (const value of [
        'javascript:alert(1)',
        'https://codepen.io.evil.test/user/pen/id',
        'https://user:password@codepen.io/user/pen/id',
    ]) {
        assert.equal(resolveZennEmbed('codepen', value), undefined);
    }
});

test('Zenn explicit cards keep their type and angle autolinks remain links', () => {
    assert.match(
        render('@[card](https://github.com/catatsumuri/inkstream)', 'zenn'),
        /ink-link-card/,
    );
    assert.doesNotMatch(
        render('<https://example.com>', 'zenn'),
        /ink-link-card/,
    );
    assert.match(
        render(
            '@[gist](https://gist.github.com/example/abcdef?file=demo.ts)',
            'zenn',
        ),
        /ink-gist-embed/,
    );
    assert.doesNotMatch(render('<!-- hidden -->', 'zenn'), /hidden/);
    assert.match(render('before<br>after', 'zenn'), /<br/);
});

test('Zenn enforces Mermaid limits and preserves ordinary line breaks', () => {
    assert.match(render('line one\nline two', 'zenn'), /line one<br\/>/);
    assert.match(
        render('```mermaid\n' + 'a'.repeat(2001) + '\n```', 'zenn'),
        /role="alert"/,
    );
    assert.match(
        render('```mermaid\ngraph LR\n' + 'a & '.repeat(11) + 'b\n```', 'zenn'),
        /role="alert"/,
    );
    assert.doesNotMatch(
        render('```mermaid\ngraph LR\na --> b\n```', 'basic'),
        /ink-mermaid/,
    );
});

test('provider options survive URL normalization', () => {
    assert.equal(
        resolveZennEmbed(
            'docswell',
            'https://www.docswell.com/s/user/LK7J5V-hello#p13',
        ),
        'https://www.docswell.com/slide/LK7J5V/embed#p13',
    );
    assert.match(
        resolveZennEmbed(
            'figma',
            'https://www.figma.com/file/example?node-id=1-2',
        )!,
        /^https:\/\/embed.figma.com\/design\/example\?node-id=1-2/,
    );
});
