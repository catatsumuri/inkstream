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

const { act, createElement } = await import('react');
const { createRoot } = await import('react-dom/client');
const { default: AppIntegrationDemo } = await import(
    '../site/src/AppIntegrationDemo.js'
);

test('static integration demo returns input state and rejects unknown actions', async () => {
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);

    await act(async () => {
        root.render(createElement(AppIntegrationDemo));
    });

    const slider = container.querySelector(
        '.ink-ui-slider input',
    ) as HTMLInputElement;
    await act(async () => {
        Object.getOwnPropertyDescriptor(
            dom.window.HTMLInputElement.prototype,
            'value',
        )!.set!.call(slider, '70');
        slider.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    assert.match(container.textContent ?? '', /閾値: 70/);

    const checkbox = container.querySelector(
        '.ink-ui-checkbox input',
    ) as HTMLInputElement;
    await act(async () => checkbox.click());
    assert.match(container.textContent ?? '', /過去の記録: 含める/);

    const select = container.querySelector(
        '.ink-ui-select select',
    ) as HTMLSelectElement;
    await act(async () => {
        select.value = 'day';
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    assert.match(container.textContent ?? '', /集計期間: 日単位/);

    const buttons = Array.from(
        container.querySelectorAll<HTMLButtonElement>('.ink-ui-button'),
    );
    await act(async () => buttons[0].click());
    assert.match(container.textContent ?? '', /更新処理: 1回/);
    assert.match(container.textContent ?? '', /許可リストで受け付け/);

    await act(async () => buttons[1].click());
    assert.match(container.textContent ?? '', /許可リスト外のため拒否/);
    assert.match(container.textContent ?? '', /更新処理: 1回/);

    await act(async () => root.unmount());
});
