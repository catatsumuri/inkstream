import assert from 'node:assert/strict';
import test from 'node:test';
import { toHtml } from 'hast-util-to-html';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { normalizeInkstreamMarkdown } from '../src/normalize-inkstream-markdown.js';
import { inkstreamRemarkPlugins } from '../src/remark-plugins.js';

// One test per row of docs/syntax.md. "unsupported" rows pin the *current*
// behavior (literal output, usually a warning); when one starts working or
// warns, this test fails and the table must be updated with it.

async function render(markdown: string) {
    const file = new VFile(normalizeInkstreamMarkdown(markdown));
    const processor = unified()
        .use(remarkParse)
        .use(inkstreamRemarkPlugins)
        .use(remarkRehype, { allowDangerousHtml: true });
    const tree = await processor.run(processor.parse(file), file);

    return {
        html: toHtml(tree as never, { allowDangerousHtml: true }),
        warnings: file.messages.map((message) => message.reason),
    };
}

// --- Callouts ---------------------------------------------------------

test('supported: Mintlify callouts, block and single-line', async () => {
    for (const source of ['<Note>\nhi\n</Note>', '<Note>hi</Note>']) {
        const { html, warnings } = await render(source);

        assert.equal(html, '<aside class="msg note"><p>hi</p></aside>');
        assert.deepEqual(warnings, []);
    }

    for (const [tag, variant] of [
        ['Tip', 'tip'],
        ['Info', 'info'],
        ['Warning', 'alert'],
        ['Check', 'check'],
    ]) {
        const { html } = await render(`<${tag}>\nx\n</${tag}>`);

        assert.match(html, new RegExp(`^<aside class="msg ${variant}">`));
    }
});

test('supported: Zenn message and details', async () => {
    const message = await render(':::message alert\nx\n:::');
    const details = await render(':::details T\nx\n:::');

    assert.equal(message.html, '<aside class="msg alert"><p>x</p></aside>');
    assert.match(details.html, /^<details><summary>T<\/summary>/);
});

test('supported: GitHub alerts, WARNING and CAUTION share a variant', async () => {
    const note = await render('> [!NOTE]\n> x');
    const warning = await render('> [!WARNING]\n> x');
    const caution = await render('> [!CAUTION]\n> x');

    assert.match(note.html, /^<aside class="msg note">/);
    assert.match(warning.html, /^<aside class="msg alert">/);
    assert.match(caution.html, /^<aside class="msg alert">/);
});

// --- Mintlify-style components ---------------------------------------

test('supported: nested block tags', async () => {
    const { html, warnings } = await render(
        '<Steps>\n<Step title="a">\nx\n</Step>\n</Steps>',
    );

    assert.equal(html, '<steps><step title="a"><p>x</p></step></steps>');
    assert.deepEqual(warnings, []);
});

test('supported: single-line block tag and self-closing tag', async () => {
    const single = await render('<Card title="a">text</Card>');
    const selfClosing = await render('<Card title="a" href="/x" />');

    assert.match(single.html, /^<card title="a"><p>text<\/p><\/card>$/);
    assert.equal(selfClosing.html, '<card title="a" href="/x"></card>');
});

test('supported: inline Badge mid-sentence', async () => {
    const { html } = await render('a <Badge>b</Badge> c');

    assert.equal(html, '<p>a <badge>b</badge> c</p>');
});

test('supported: array attribute is flattened', async () => {
    const { html } = await render('<Card tags={["A","B"]}>\nb\n</Card>');

    assert.match(html, /^<card tags="A,B">/);
});

test('unsupported: JSX expression attribute', async () => {
    const { html, warnings } = await render('<Card title={"x"}>\nb\n</Card>');

    assert.doesNotMatch(html, /<card/);
    assert.deepEqual(warnings, ['Unmatched closing tag </Card>']);
});

test('unsupported: multi-line open tag', async () => {
    const { html, warnings } = await render(
        '<Card\n  title="foo"\n  icon="rocket"\n>\nbody\n</Card>',
    );

    assert.doesNotMatch(html, /<card/);
    assert.deepEqual(warnings, ['Unmatched closing tag </Card>']);
});

test('unsupported: ">" inside an attribute value', async () => {
    const { html, warnings } = await render('<Card title=">">\nbody\n</Card>');

    assert.doesNotMatch(html, /<card/);
    assert.equal(warnings.length, 2);
    assert.equal(warnings[0], 'Unmatched closing tag </Card>');
    assert.match(warnings[1], /^<Card> was left as raw HTML/);
});

test('unsupported: unknown tag passes through with a warning', async () => {
    const { html, warnings } = await render('<Foo>\nbar\n</Foo>');

    assert.equal(html, '<Foo>\nbar\n</Foo>');
    assert.deepEqual(warnings, [
        '<Foo> is not a supported component and was left as raw HTML',
    ]);
});

test('supported: unclosed tag auto-closes with a warning', async () => {
    const { html, warnings } = await render('<Note>\nfoo');

    assert.equal(html, '<aside class="msg note"><p>foo</p></aside>');
    assert.deepEqual(warnings, ['<Note> was never closed']);
});

test('supported: unmatched closing tag stays literal with a warning', async () => {
    const { html, warnings } = await render('foo\n\n</Note>');

    assert.equal(html, '<p>foo</p>\n</Note>');
    assert.deepEqual(warnings, ['Unmatched closing tag </Note>']);
});

test('supported: tag in a blockquote with blank lines around it', async () => {
    const { html } = await render('> <Note>\n>\n> foo\n>\n> </Note>');

    assert.match(html, /<blockquote>\n<aside class="msg note">/);
});

test('unsupported: tag in a blockquote without blank lines', async () => {
    const { html, warnings } = await render('> <Note>\n> foo\n> </Note>');

    assert.doesNotMatch(html, /aside/);
    assert.match(html, /<Note>/);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /^<Note> was left as raw HTML/);
});

test('partial: tag in a list item renders outside the list', async () => {
    const { html } = await render('- item\n\n  <Note>\n  foo\n  </Note>');

    assert.match(html, /<\/ul>\n<aside class="msg note">/);
});

test('unsupported: MDX comment is literal text', async () => {
    const { html } = await render('{/* c */}');

    assert.equal(html, '<p>{/* c */}</p>');
});

// --- Fenced components -----------------------------------------------

test('supported: tree fence', async () => {
    const { html, warnings } = await render('```tree\nsrc/a.ts\n```');

    assert.match(html, /^<tree tree="/);
    assert.deepEqual(warnings, []);
});

test('supported: malformed quiz and chart fences warn and stay code', async () => {
    const quiz = await render('```quiz\nnot valid\n```');
    const chart = await render('```chart:bar\nnot valid\n```');

    assert.match(quiz.html, /^<pre><code class="language-quiz">/);
    assert.match(quiz.warnings[0], /^Malformed quiz fence/);
    assert.match(chart.html, /^<pre><code class="language-chart:bar">/);
    assert.match(chart.warnings[0], /^Malformed chart fence/);
});

test('supported: well-formed quiz and chart fences', async () => {
    const quiz = await render(
        '```quiz\nquestion: 1+1?\nA: 1\nB: 2\ncorrect: B\n```',
    );
    const chart = await render('```chart:bar\na: 1\nb: 2\n```');

    assert.match(quiz.html, /^<quiz quiz="/);
    assert.deepEqual(quiz.warnings, []);
    assert.match(chart.html, /^<chart chart="/);
    assert.deepEqual(chart.warnings, []);
});

// --- Zenn extensions and embeds --------------------------------------

test('supported: Zenn image size is encoded into the URL', async () => {
    const { html } = await render('![a](/x.png =250x)');

    assert.equal(html, '<p><img src="/x.png?__markdown_width=250" alt="a"></p>');
});

test('supported: Zenn @[card] becomes a link card; other embeds are literal', async () => {
    const card = await render('@[card](https://example.com)');
    const youtube = await render('@[youtube](abc)');
    const tweet = await render('@[tweet](https://x.com/a/status/1)');

    assert.match(card.html, /^<linkcard url="https:\/\/example.com"/);
    // No embed element: they fall through as an ordinary markdown link.
    assert.equal(youtube.html, '<p>@<a href="abc">youtube</a></p>');
    assert.doesNotMatch(tweet.html, /linkcard|embed/);
});

test('supported: standalone YouTube URL becomes an embed', async () => {
    const { html } = await render('https://www.youtube.com/watch?v=abc');

    assert.match(html, /^<youtubeembed url="/);
});

// --- Markdown base ---------------------------------------------------

test('partial: wikilinks stay literal without a resolver', async () => {
    const { html } = await render('[[a/b|c]]');

    assert.equal(html, '<p>[[a/b|c]]</p>');
});

test('supported: single tilde is not strikethrough', async () => {
    const { html } = await render('a ~b~ c ~~d~~');

    assert.match(html, /~b~/);
    assert.match(html, /<del>d<\/del>/);
});

test('core pipeline leaves {#id} in heading text (React layer applies it)', async () => {
    const { html } = await render('## T {#my-id}');

    assert.equal(html, '<h2>T {#my-id}</h2>');
});
