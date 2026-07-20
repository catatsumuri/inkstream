import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchTextWithRetry } from '../src/react/embed-components.js';

test('fetchTextWithRetry retries once after a failed fetch and recovers', async () => {
    let calls = 0;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => {
        calls += 1;

        if (calls === 1) {
            return new Response(null, { status: 500 });
        }

        return new Response('content after retry', { status: 200 });
    }) as typeof fetch;

    try {
        const text = await fetchTextWithRetry('https://example.invalid/file', {
            retryDelayMs: 5,
        });

        assert.equal(calls, 2);
        assert.equal(text, 'content after retry');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('fetchTextWithRetry throws when the retry also fails', async () => {
    let calls = 0;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => {
        calls += 1;

        return new Response(null, { status: 500 });
    }) as typeof fetch;

    try {
        await assert.rejects(() =>
            fetchTextWithRetry('https://example.invalid/file', {
                retryDelayMs: 5,
            }),
        );
        assert.equal(calls, 2);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('fetchTextWithRetry succeeds immediately without retrying', async () => {
    let calls = 0;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => {
        calls += 1;

        return new Response('first try', { status: 200 });
    }) as typeof fetch;

    try {
        const text = await fetchTextWithRetry('https://example.invalid/file', {
            retryDelayMs: 5,
        });

        assert.equal(calls, 1);
        assert.equal(text, 'first try');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('fetchTextWithRetry stops without a second attempt once aborted', async () => {
    let calls = 0;
    const originalFetch = globalThis.fetch;
    const controller = new AbortController();

    globalThis.fetch = (async () => {
        calls += 1;
        controller.abort();

        return new Response(null, { status: 500 });
    }) as typeof fetch;

    try {
        await assert.rejects(() =>
            fetchTextWithRetry('https://example.invalid/file', {
                signal: controller.signal,
                retryDelayMs: 5,
            }),
        );
        assert.equal(calls, 1);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
