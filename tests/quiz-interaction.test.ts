import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');

Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    customElements: dom.window.customElements,
});
Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
});
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { act } = await import('react');
const { createElement } = await import('react');
const { createRoot } = await import('react-dom/client');
const { InkstreamMarkdown } = await import('../src/react/index.js');

function query(selector: string): Element {
    const element = dom.window.document.querySelector(selector);
    assert.ok(element, `expected to find "${selector}"`);

    return element;
}

function queryAll(selector: string): HTMLButtonElement[] {
    return Array.from(
        dom.window.document.querySelectorAll(selector),
    ) as HTMLButtonElement[];
}

const quizMarkdown = [
    '```quiz',
    'question: 2 + 2 は?',
    'correct: B',
    '',
    'A: 3',
    'B: 4',
    '',
    'hint: 指を使って数えてみましょう。',
    'correctMessage: 正解です',
    'incorrect: 残念、違います',
    'explanation: 2 + 2 は 4 です。',
    '```',
].join('\n');

test('quiz: selecting the correct option and submitting shows the correct state', async () => {
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);

    await act(async () => {
        root.render(createElement(InkstreamMarkdown, { children: quizMarkdown }));
    });

    const options = queryAll('.ink-quiz-option');
    assert.equal(options.length, 2);

    const submit = query('.ink-quiz-submit') as HTMLButtonElement;
    assert.equal(submit.disabled, true);

    await act(async () => {
        options[1].click();
    });

    assert.equal(query('.ink-quiz-submit')!.hasAttribute('disabled'), false);

    await act(async () => {
        query('.ink-quiz-submit').dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true }),
        );
    });

    assert.match(query('.ink-quiz-status').textContent ?? '', /正解です/);
    assert.match(
        container.textContent ?? '',
        /2 \+ 2 は 4 です。/,
    );
    assert.equal(dom.window.document.querySelectorAll('.ink-quiz-option').length, 0);

    await act(async () => {
        query('.ink-quiz-retry').dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true }),
        );
    });

    assert.equal(queryAll('.ink-quiz-option').length, 2);

    await act(async () => {
        root.unmount();
    });
});

test('quiz: selecting the wrong option shows the hint, not the explanation', async () => {
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);

    await act(async () => {
        root.render(createElement(InkstreamMarkdown, { children: quizMarkdown }));
    });

    const options = queryAll('.ink-quiz-option');

    await act(async () => {
        options[0].dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true }),
        );
    });
    await act(async () => {
        query('.ink-quiz-submit').dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true }),
        );
    });

    assert.match(query('.ink-quiz-status').textContent ?? '', /残念、違います/);
    assert.match(container.textContent ?? '', /指を使って数えてみましょう。/);
    assert.doesNotMatch(container.textContent ?? '', /2 \+ 2 は 4 です。/);

    await act(async () => {
        root.unmount();
    });
});
