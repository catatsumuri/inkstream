import assert from 'node:assert/strict';
import test from 'node:test';
import { runCli } from '../src/cli.js';

test('render outputs HTML for the given markdown', async () => {
    const { exitCode, output } = await runCli(['render'], '# Hello\n\nworld');

    assert.equal(exitCode, 0);
    assert.equal(output, '<h1>Hello</h1>\n<p>world</p>');
});

test('text outputs plain text for the given markdown', async () => {
    const { exitCode, output } = await runCli(['text'], '# Hello\n\nworld with **bold**');

    assert.equal(exitCode, 0);
    assert.equal(output, 'Hello\n\nworld with bold');
});

test('headings --json outputs a JSON array matching extractMarkdownHeadings', async () => {
    const { exitCode, output } = await runCli(
        ['headings', '-', '--json'],
        '# Title\n\n## Section',
    );

    assert.equal(exitCode, 0);
    assert.deepEqual(JSON.parse(output), [
        { level: 1, text: 'Title', id: 'title' },
        { level: 2, text: 'Section', id: 'section' },
    ]);
});

test('headings without --json outputs an indented outline', async () => {
    const { exitCode, output } = await runCli(['headings'], '# Title\n\n## Section');

    assert.equal(exitCode, 0);
    assert.equal(output, 'Title\n  Section');
});

test('headings --prefix disambiguates ids the same way extractMarkdownHeadings does', async () => {
    const { output } = await runCli(
        ['headings', '-', '--json', '--prefix=doc1'],
        '# Title',
    );

    assert.deepEqual(JSON.parse(output), [
        { level: 1, text: 'Title', id: 'doc1-title' },
    ]);
});

test('an unknown command exits non-zero and prints usage', async () => {
    const { exitCode, output } = await runCli(['bogus'], '');

    assert.equal(exitCode, 1);
    assert.match(output, /Unknown command: bogus/);
    assert.match(output, /Usage: inkstream/);
});

test('no command prints usage and exits non-zero', async () => {
    const { exitCode, output } = await runCli([]);

    assert.equal(exitCode, 1);
    assert.match(output, /Usage: inkstream/);
});

test('--help prints usage and exits zero', async () => {
    const { exitCode, output } = await runCli(['--help']);

    assert.equal(exitCode, 0);
    assert.match(output, /Usage: inkstream/);
});
