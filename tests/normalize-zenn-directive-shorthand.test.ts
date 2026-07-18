import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeZennDirectiveShorthand } from '../src/normalize-zenn-directive-shorthand.js';

test('rewrites :::message <variant> to the {.class} form', () => {
    assert.equal(
        normalizeZennDirectiveShorthand(':::message alert\ntext\n:::'),
        ':::message{.alert}\ntext\n:::',
    );
});

test('rewrites :::details <title> to the [label] form', () => {
    assert.equal(
        normalizeZennDirectiveShorthand(':::details タイトル\ntext\n:::'),
        ':::details[タイトル]\ntext\n:::',
    );
});

test('leaves a bare :::message / :::details untouched', () => {
    const input = ':::message\ntext\n:::\n\n:::details\nbody\n:::';
    assert.equal(normalizeZennDirectiveShorthand(input), input);
});

test('does not rewrite shorthand-looking text inside a code fence', () => {
    const input = '```\n:::message alert\n:::details タイトル\n```';
    assert.equal(normalizeZennDirectiveShorthand(input), input);
});

test('matches details shorthand regardless of colon-fence depth', () => {
    assert.equal(
        normalizeZennDirectiveShorthand('::::details 外側\n:::details 内側\n:::\n::::'),
        '::::details[外側]\n:::details[内側]\n:::\n::::',
    );
});
