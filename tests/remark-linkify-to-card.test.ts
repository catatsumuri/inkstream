import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InkstreamMarkdown } from '../src/react/index.js';
import {
    extractYoutubeVideoParameters,
    isGithubUrl,
    isYoutubeUrl,
    parseGithubUrl,
} from '../src/url-matcher.js';

function render(markdown: string): string {
    return renderToStaticMarkup(
        createElement(InkstreamMarkdown, null, markdown),
    );
}

test('renders a standalone URL line as a link card', () => {
    const html = render('before\n\nhttps://zenn.dev\n\nafter');

    assert.match(
        html,
        /<a href="https:\/\/zenn\.dev" target="_blank" rel="noopener noreferrer" class="ink-link-card">/,
    );
    assert.match(html, /<span class="ink-link-card-domain">zenn\.dev<\/span>/);
    assert.match(html, /<p>before<\/p>/);
    assert.match(html, /<p>after<\/p>/);
});

test('renders @[card](url) shorthand as a link card', () => {
    const html = render('@[card](https://zenn.dev/zenn/articles/markdown-guide)');

    assert.match(
        html,
        /class="ink-link-card"[^>]*>|href="https:\/\/zenn\.dev\/zenn\/articles\/markdown-guide"/,
    );
    assert.match(html, /ink-link-card/);
});

test('renders a standalone YouTube URL as an embedded player', () => {
    const html = render('https://www.youtube.com/watch?v=WRVsOCh907o');

    assert.match(html, /<div class="ink-youtube">/);
    assert.match(
        html,
        /src="https:\/\/www\.youtube-nocookie\.com\/embed\/WRVsOCh907o"/,
    );
});

test('renders a standalone GitHub blob URL as a github embed shell', () => {
    const html = render(
        'https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json#L1-L3',
    );

    assert.match(html, /<div class="ink-github-embed">/);
    assert.match(html, /lerna\.json/);
    assert.match(html, /L1–L3/);
    assert.match(html, /zenn-dev\/zenn-editor/);
});

test('leaves URLs inside sentences as plain links', () => {
    const html = render('see https://zenn.dev for details');

    assert.doesNotMatch(html, /ink-link-card/);
    assert.match(html, /<a href="https:\/\/zenn\.dev">https:\/\/zenn\.dev<\/a>/);
});

test('leaves URLs inside code fences untouched', () => {
    const html = render('```md\nhttps://zenn.dev\n```');

    assert.doesNotMatch(html, /ink-link-card/);
});

test('linkifies an explicit markdown link on its own line', () => {
    const html = render('[Zenn](https://zenn.dev)');

    assert.match(html, /class="ink-link-card"/);
});

test('classifies URLs into embed types', () => {
    assert.equal(isYoutubeUrl('https://www.youtube.com/watch?v=WRVsOCh907o'), true);
    assert.equal(isYoutubeUrl('https://youtu.be/WRVsOCh907o'), true);
    assert.equal(isYoutubeUrl('https://zenn.dev'), false);
    assert.equal(
        isGithubUrl(
            'https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json',
        ),
        true,
    );
    assert.equal(isGithubUrl('https://github.com/zenn-dev/zenn-editor'), false);
});

test('extracts YouTube video parameters including start time', () => {
    assert.deepEqual(
        extractYoutubeVideoParameters(
            'https://www.youtube.com/watch?v=WRVsOCh907o&t=1m30s',
        ),
        { videoId: 'WRVsOCh907o', start: '90' },
    );
    assert.equal(
        extractYoutubeVideoParameters('https://www.youtube.com/watch?v=short'),
        undefined,
    );
});

test('parses GitHub blob URLs with line ranges', () => {
    assert.deepEqual(
        parseGithubUrl(
            'https://github.com/zenn-dev/zenn-editor/blob/canary/lerna.json#L1-L3',
        ),
        {
            owner: 'zenn-dev',
            repo: 'zenn-editor',
            branch: 'canary',
            path: 'lerna.json',
            lineStart: 1,
            lineEnd: 3,
        },
    );
});
