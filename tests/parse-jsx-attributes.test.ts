import assert from 'node:assert/strict';
import test from 'node:test';
import { parseJsxAttributes } from '../src/parse-jsx-attributes.js';

test('decodes numeric hex, numeric decimal, and named references', () => {
    assert.deepEqual(
        parseJsxAttributes(
            'a="&#x22;x&#x22;" b="&#34;y&#34;" c="&quot;z&quot;" d="&lt;i&gt; &amp; &copy;"',
        ),
        { a: '"x"', b: '"y"', c: '"z"', d: '<i> & ©' },
    );
});

test('decodes exactly once', () => {
    assert.deepEqual(parseJsxAttributes('a="&amp;#x22;" b="&amp;quot;"'), {
        a: '&#x22;',
        b: '&quot;',
    });
});

test('leaves unknown or invalid references as written', () => {
    assert.deepEqual(
        parseJsxAttributes('a="&notareference;" b="&#0;" c="&#x110000;" d="a & b"'),
        { a: '&notareference;', b: '&#0;', c: '&#x110000;', d: 'a & b' },
    );
});

test('does not decode brace string literals', () => {
    assert.deepEqual(parseJsxAttributes('a={"&#x22;"} b={\'&amp;\'}'), {
        a: '&#x22;',
        b: '&amp;',
    });
});

test('plain values are unchanged', () => {
    assert.deepEqual(parseJsxAttributes('title="Hello" cols={2} required'), {
        title: 'Hello',
        cols: '2',
        required: 'true',
    });
});
