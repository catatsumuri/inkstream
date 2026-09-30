import assert from 'node:assert/strict';
import test from 'node:test';
import { isTagLine, matchCloseTag, matchOpenTag } from '../src/match-tags.js';
import { normalizeMintlifyBlocks } from '../src/normalize-mintlify-blocks.js';

const generic = '<ParamField body="questions" type="map<string, Question>" required>';

test('matchOpenTag accepts ">" inside a quoted attribute value', () => {
    assert.deepEqual(matchOpenTag(generic), {
        name: 'ParamField',
        attributes: {
            body: 'questions',
            type: 'map<string, Question>',
            required: 'true',
        },
        selfClosing: false,
    });
});

test('matchOpenTag handles a self-closing tag with a generic type', () => {
    const match = matchOpenTag('<ResponseField name="a" type="array<string>" />');

    assert.equal(match?.selfClosing, true);
    assert.equal(match?.attributes.type, 'array<string>');
});

test('matchOpenTag still ends the tag at an unquoted ">"', () => {
    assert.equal(matchOpenTag('<Card title="a"> trailing'), null);
    assert.equal(matchOpenTag('<Card title="a">')?.attributes.title, 'a');
});

test('isTagLine recognizes a tag line with a quoted ">"', () => {
    assert.equal(isTagLine(generic), true);
    assert.equal(isTagLine('<ParamField body="x" type="a<b>" />'), true);
    assert.equal(isTagLine('<ParamField body="x" type="a<b>"> text'), false);
});

test('matchCloseTag is unaffected', () => {
    assert.deepEqual(matchCloseTag('</ParamField>'), { name: 'ParamField' });
});

test('normalizeMintlifyBlocks isolates a generic-typed tag line', () => {
    const normalized = normalizeMintlifyBlocks(
        `text\n  ${generic}\n  body\n</ParamField>`,
    );

    assert.equal(
        normalized,
        `text\n\n${generic}\n\nbody\n\n</ParamField>\n`,
    );
});
