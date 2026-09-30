import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeUrl } from '../src/safe-url.js';

const schemes = ['http', 'https', 'mailto'] as const;

test('allows listed absolute schemes, case-insensitively', () => {
    for (const url of [
        'https://example.com/a?b=1#c',
        'http://example.com',
        'HTTPS://EXAMPLE.COM',
        'mailto:a@b.c',
    ]) {
        assert.equal(isSafeUrl(url, schemes), true, url);
    }
});

test('allows relative URLs and fragments', () => {
    for (const url of ['/docs/x', './x', '../x', '#sec', '?q=1', 'x/y', 'a.html', '/a:b']) {
        assert.equal(isSafeUrl(url, schemes), true, url);
    }
});

test('rejects other schemes', () => {
    for (const url of [
        'javascript:alert(1)',
        'JavaScript:alert(1)',
        'vbscript:x',
        'data:text/html;base64,AAAA',
        'file:///etc/passwd',
        'tel:+81',
        'ftp://x',
    ]) {
        assert.equal(isSafeUrl(url, schemes), false, url);
    }
});

test('rejects a scheme hidden by whitespace or control characters', () => {
    const tab = String.fromCharCode(9);
    const newline = String.fromCharCode(10);
    const nul = String.fromCharCode(0);

    for (const url of [
        `java${tab}script:alert(1)`,
        `java${newline}script:alert(1)`,
        `${nul}javascript:alert(1)`,
        `  javascript:alert(1)`,
        `jav${String.fromCharCode(0x2028)}ascript:alert(1)`,
    ]) {
        assert.equal(isSafeUrl(url, schemes), false, JSON.stringify(url));
    }
});

test('rejects empty input and an unparseable scheme', () => {
    assert.equal(isSafeUrl('', schemes), false);
    assert.equal(isSafeUrl('   ', schemes), false);
    assert.equal(isSafeUrl('1abc:x', schemes), false);
});
