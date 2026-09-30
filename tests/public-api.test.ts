import assert from 'node:assert/strict';
import test from 'node:test';
import * as advanced from '../src/advanced.js';
import * as root from '../src/index.js';

// Pins the export surface: adding or removing a name here is a deliberate
// API decision (see CHANGELOG.md versioning policy).

test('root exports the public API', () => {
    assert.deepEqual(Object.keys(root).sort(), [
        'extractMarkdownHeadings',
        'extractPlainText',
        'extractYoutubeVideoParameters',
        'inkstreamRemarkPlugins',
        'isGithubUrl',
        'isYoutubeUrl',
        'normalizeInkstreamMarkdown',
        'parseChartFence',
        'parseGithubUrl',
        'parseImageMetadata',
        'parseQuizFence',
        'parseTreeFence',
        'remarkWikilinks',
    ]);
});

test('advanced exports the low-level building blocks', () => {
    assert.deepEqual(Object.keys(advanced).sort(), [
        'GITHUB_ALERT_VARIANTS',
        'MINTLIFY_ATTRIBUTE_NAMES',
        'MINTLIFY_BLOCK_TAG_NAMES',
        'MINTLIFY_CALLOUT_TAG_NAMES',
        'MINTLIFY_CALLOUT_VARIANTS',
        'MINTLIFY_INLINE_TAG_NAMES',
        'createHeadingIdDispenser',
        'normalizeHtmlHeadings',
        'normalizeMarkdownHeadingText',
        'normalizeMintlifyBlocks',
        'normalizeZennDirectiveShorthand',
        'normalizeZennImages',
        'parseJsxAttributes',
        'parseTreeTags',
        'remarkCodeFenceComponents',
        'remarkCodeMeta',
        'remarkGithubAlerts',
        'remarkHtmlAnchors',
        'remarkLinkifyToCard',
        'remarkMintlifyTags',
        'remarkTreeTags',
        'remarkZennDirective',
        'slugify',
    ]);
});
