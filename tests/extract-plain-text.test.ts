import assert from 'node:assert/strict';
import test from 'node:test';
import { extractPlainText } from '../src/extract-plain-text.js';

test('strips markdown emphasis/link markup, keeping inline text contiguous', () => {
    const text = extractPlainText('This is **bold** and _italic_ and a [link](https://example.com).');

    assert.equal(text, 'This is bold and italic and a link.');
});

test('separates block-level content with blank lines', () => {
    const text = extractPlainText('# Title\n\nFirst paragraph.\n\nSecond paragraph.');

    assert.equal(text, 'Title\n\nFirst paragraph.\n\nSecond paragraph.');
});

test('resolves a Mintlify callout to its body text, dropping the tag syntax', () => {
    const text = extractPlainText('<Note>\n\nHeads up, this matters.\n\n</Note>');

    assert.equal(text, 'Heads up, this matters.');
});

test('resolves :::message shorthand the same way as the Mintlify tag', () => {
    const text = extractPlainText(':::message alert\ndanger ahead\n:::');

    assert.equal(text, 'danger ahead');
});

test('extracts a quiz fence\'s question, options, and explanation', () => {
    const quiz = [
        '```quiz',
        'question: What is 2+2?',
        'A: 3',
        'B: 4',
        'correct: B',
        'explanation: Basic arithmetic.',
        '```',
    ].join('\n');

    const text = extractPlainText(quiz);

    assert.equal(
        text,
        'What is 2+2?\n\n3\n\n4\n\nBasic arithmetic.',
    );
});

test('extracts a chart fence\'s title and labels, not the numeric values', () => {
    const chart = [
        '```chart:bar',
        '_title: Flavor Profile',
        'juniper: 9',
        'citrus: 4',
        '```',
    ].join('\n');

    const text = extractPlainText(chart);

    assert.equal(text, 'Flavor Profile\n\njuniper\n\ncitrus');
});

test('extracts a tree fence\'s file and folder names', () => {
    const tree = ['```tree', 'src/', '  index.ts', '```'].join('\n');

    const text = extractPlainText(tree);

    assert.equal(text, 'src\n\nindex.ts');
});

test('resolves a wikilink to its label without needing a resolver', () => {
    const text = extractPlainText('See [[some/path|Custom Label]] for details.');

    assert.equal(text, 'See Custom Label for details.');
});

test('resolves an unlabeled wikilink to the path\'s last segment', () => {
    const text = extractPlainText('See [[ns/known]] for details.');

    assert.equal(text, 'See known for details.');
});

test('uses image alt text in place of the image markup', () => {
    const text = extractPlainText('Before ![a diagram](diagram.png) after.');

    assert.equal(text, 'Before a diagram after.');
});

test('keeps plain code fence content as searchable text', () => {
    const text = extractPlainText('```js\nconst answer = 42;\n```');

    assert.equal(text, 'const answer = 42;');
});

test('drops standalone-URL link-card paragraphs (no meaningful text, just a bare URL)', () => {
    const text = extractPlainText('before\n\nhttps://example.com\n\nafter');

    assert.equal(text, 'before\n\nafter');
});
