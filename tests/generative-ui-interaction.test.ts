import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import { InkstreamMarkdown } from '../src/react/index.js';

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
const { createRoot } = await import('react-dom/client');

test('button action is reported as data and generated handlers are ignored', async () => {
    const events: unknown[] = [];
    const markdown =
        '<Button action="refresh-report" onClick="alert(1)">Refresh</Button>';
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: markdown,
            generativeUi: true,
        }),
    );
    assert.match(html, /<button type="button" class="ink-ui-button">Refresh<\/button>/);

    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });
    await act(async () => {
        container.querySelector('button')!.click();
    });

    assert.deepEqual(events, [{ type: 'action', action: 'refresh-report' }]);
    await act(async () => root.unmount());
});

test('adjacent inline Button tags stay separate in one Markdown paragraph', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children:
                '<Button action="refresh-report">Refresh</Button>\n<Button action="delete-all">Delete</Button>',
            generativeUi: true,
        }),
    );
    assert.equal((html.match(/class="ink-ui-button"/g) ?? []).length, 2);
    assert.match(html, /Refresh/);
    assert.match(html, /Delete/);
});

test('slider renders in SSR and notifies the app when its value changes', async () => {
    const markdown =
        '<Slider id="threshold" label="Threshold" min="0" max="100" step="5" default="65" />';
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: markdown,
            generativeUi: true,
            generativeUiValues: { threshold: 25 },
        }),
    );
    assert.match(html, /type="range"/);
    assert.match(html, /aria-label="Threshold"/);
    assert.match(html, /value="25"/);

    const events: unknown[] = [];
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                generativeUiValues: { threshold: 25 },
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });

    const slider = container.querySelector(
        'input[type="range"]',
    ) as HTMLInputElement;
    await act(async () => {
        Object.getOwnPropertyDescriptor(
            dom.window.HTMLInputElement.prototype,
            'value',
        )!.set!.call(slider, '75');
        slider.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
    assert.deepEqual(events, [{ type: 'change', id: 'threshold', value: 75 }]);

    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                generativeUiValues: { threshold: 75 },
                onGenerativeUiEvent: () => undefined,
            }),
        );
    });
    assert.equal(slider.value, '75');

    await act(async () => root.unmount());
});

test('checkbox and select support typed values, SSR, and application-controlled updates', async () => {
    const markdown = [
        '<Checkbox id="alerts" label="Enable alerts" default="true" />',
        '',
        '<Select id="period" label="Period" default="week">',
        '<Option value="day">',
        'Daily',
        '</Option>',
        '',
        '<Option value="week">',
        'Weekly',
        '</Option>',
        '</Select>',
    ].join('\n');
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: markdown,
            generativeUi: true,
        }),
    );
    assert.match(html, /type="checkbox"[^>]*checked/);
    assert.match(html, /<option value="day">Daily<\/option>/);
    assert.match(html, /<option value="week" selected="">Weekly<\/option>/);

    const events: unknown[] = [];
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                generativeUiValues: { alerts: false, period: 'day' },
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });

    const checkbox = container.querySelector(
        'input[type="checkbox"]',
    ) as HTMLInputElement;
    const select = container.querySelector('select') as HTMLSelectElement;
    assert.equal(checkbox.checked, false);
    assert.equal(select.value, 'day');

    await act(async () => checkbox.click());
    await act(async () => {
        select.value = 'week';
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    assert.deepEqual(events, [
        { type: 'change', id: 'alerts', value: true },
        { type: 'change', id: 'period', value: 'week' },
    ]);

    const originalConsoleError = console.error;
    const errors: unknown[][] = [];
    console.error = (...args: unknown[]) => errors.push(args);
    try {
        await act(async () => {
            root.render(
                createElement(InkstreamMarkdown, {
                    children: markdown,
                    generativeUi: true,
                }),
            );
        });
        assert.equal(
            (container.querySelector('input[type="checkbox"]') as HTMLInputElement)
                .checked,
            true,
        );
        assert.equal(
            (container.querySelector('select') as HTMLSelectElement).value,
            'week',
        );
        assert.deepEqual(errors, []);
    } finally {
        console.error = originalConsoleError;
    }

    await act(async () => root.unmount());
});

test('checkbox and select fall back safely for invalid external values', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: [
                '<Checkbox id="alerts" label="Enable alerts" default="true" />',
                '',
                '<Select id="period" default="week">',
                '<Option value="day">',
                'Daily',
                '</Option>',
                '',
                '<Option value="week">',
                'Weekly',
                '</Option>',
                '</Select>',
            ].join('\n'),
            generativeUi: true,
            generativeUiValues: { alerts: 'true', period: 'year' },
        }),
    );
    assert.match(html, /type="checkbox"[^>]*checked/);
    assert.match(html, /<option value="week" selected="">Weekly<\/option>/);
});

test('Select with no Option children is hidden and emits no events', async () => {
    const markdown =
        '<Select id="period" label="Period">\n</Select>';
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: markdown,
            generativeUi: true,
        }),
    );
    assert.doesNotMatch(html, /class="ink-ui-select"/);

    const events: unknown[] = [];
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });
    assert.equal(container.querySelector('select'), null);
    assert.deepEqual(events, []);
    await act(async () => root.unmount());
});

test('Select keeps only the first Option with a duplicated value', async () => {
    const markdown = [
        '<Select id="period" label="Period" default="day">',
        '<Option value="day">',
        'Daily',
        '</Option>',
        '',
        '<Option value="day">',
        'Per day',
        '</Option>',
        '',
        '<Option value="week">',
        'Weekly',
        '</Option>',
        '</Select>',
    ].join('\n');
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: markdown,
            generativeUi: true,
            generativeUiValues: { period: 'day' },
        }),
    );
    assert.equal((html.match(/<option\b/g) ?? []).length, 2);
    assert.match(html, /<option value="day" selected="">Daily<\/option>/);
    assert.doesNotMatch(html, /Per day/);

    const events: unknown[] = [];
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                generativeUiValues: { period: 'day' },
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    assert.equal(select.options.length, 2);
    assert.equal(select.options[0].textContent, 'Daily');
    await act(async () => {
        root.render(
            createElement(InkstreamMarkdown, {
                children: markdown,
                generativeUi: true,
                generativeUiValues: { period: 'week' },
                onGenerativeUiEvent: (event) => events.push(event),
            }),
        );
    });
    assert.equal(select.value, 'week');

    await act(async () => {
        select.value = 'day';
        select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    });
    assert.deepEqual(events, [{ type: 'change', id: 'period', value: 'day' }]);
    await act(async () => root.unmount());
});

test('slider clamps controlled values and rejects malformed attributes', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children:
                '<Slider id="threshold" min="0" max="100" default="65" />\n\n<Slider id="bad id" min="0" max="100" />',
            generativeUi: true,
            generativeUiValues: { threshold: 150 },
        }),
    );
    assert.match(html, /value="100"/);
    assert.doesNotMatch(html, /id="bad id"/);
});

test('slider can switch between uncontrolled and controlled without React warnings', async () => {
    const markdown =
        '<Slider id="threshold" min="0" max="100" default="65" />';
    const container = dom.window.document.getElementById('root')!;
    const root = createRoot(container);
    const originalConsoleError = console.error;
    const errors: unknown[][] = [];
    console.error = (...args: unknown[]) => errors.push(args);

    try {
        await act(async () => {
            root.render(
                createElement(InkstreamMarkdown, {
                    children: markdown,
                    generativeUi: true,
                }),
            );
        });
        assert.equal(
            (container.querySelector('input[type="range"]') as HTMLInputElement)
                .value,
            '65',
        );

        await act(async () => {
            root.render(
                createElement(InkstreamMarkdown, {
                    children: markdown,
                    generativeUi: true,
                    generativeUiValues: { threshold: 30 },
                }),
            );
        });
        assert.equal(
            (container.querySelector('input[type="range"]') as HTMLInputElement)
                .value,
            '30',
        );

        await act(async () => {
            root.render(
                createElement(InkstreamMarkdown, {
                    children: markdown,
                    generativeUi: true,
                }),
            );
        });
        assert.equal(
            (container.querySelector('input[type="range"]') as HTMLInputElement)
                .value,
            '65',
        );
        assert.deepEqual(errors, []);
    } finally {
        console.error = originalConsoleError;
        await act(async () => root.unmount());
    }
});

test('slider rejects invalid numeric configurations and safely handles invalid external values', () => {
    const html = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children: [
                '<Slider id="bad-range" min="10" max="10" />',
                '<Slider id="bad-step" min="0" max="10" step="0" default="0" />',
                '<Slider id="bad-min" min="nope" max="10" />',
                '<Slider id="bad-max" min="0" max="Infinity" />',
                '<Slider id="bad-default" min="0" max="10" default="NaN" />',
                '<Slider id="default-out-of-range" min="0" max="10" default="20" />',
            ].join('\n\n'),
            generativeUi: true,
            generativeUiValues: { 'bad-step': Number.NaN },
        }),
    );

    assert.doesNotMatch(html, /id="bad-range"/);
    assert.doesNotMatch(html, /id="bad-step"/);
    assert.match(html, /id="bad-min" type="range" min="0" max="10"/);
    assert.match(html, /id="bad-max" type="range" min="0" max="100"/);
    assert.match(html, /id="bad-default" type="range" min="0" max="10"[^>]*value="10"/);
    assert.match(html, /id="default-out-of-range"[^>]*value="10"/);

    const externalInvalidHtml = renderToStaticMarkup(
        createElement(InkstreamMarkdown, {
            children:
                '<Slider id="external-invalid" min="0" max="10" default="4" />',
            generativeUi: true,
            generativeUiValues: { 'external-invalid': Number.NaN },
        }),
    );
    assert.match(externalInvalidHtml, /id="external-invalid"[^>]*value="4"/);
});

test('Input preserves text in SSR, hides missing IDs, and ignores executable attributes', () => {
    const html = renderToStaticMarkup(createElement(InkstreamMarkdown, {
        children: '<Input id="query" label="検索" default="日本語 &lt;script&gt;" placeholder="キーワード" onChange="alert(1)" type="password" />\n\n<Input label="missing" />',
        generativeUi: true,
    }));
    assert.match(html, /type="text"/);
    assert.match(html, /aria-label="検索"/);
    assert.match(html, /placeholder="キーワード"/);
    assert.doesNotMatch(html, /alert\(1\)|type="password"/);
    assert.equal((html.match(/type="text"/g) ?? []).length, 1);
});

test('Input supports string control, empty values, mode changes, and string events', async () => {
    const container = document.getElementById('root')!;
    const root = createRoot(container);
    const events: unknown[] = [];
    const warnings: unknown[] = [];
    const previousError = console.error;
    console.error = (...args) => warnings.push(args);
    const render = async (values?: Record<string, string | number | boolean>) => {
        await act(async () => root.render(createElement(InkstreamMarkdown, {
            children: '<Input id="query" default="初期値" />',
            generativeUi: true,
            generativeUiValues: values,
            onGenerativeUiEvent: event => events.push(event),
        })));
    };
    const input = () => container.querySelector('input')!;
    try {
        await render();
        assert.equal(input().value, '初期値');
        await render({ query: '' });
        assert.equal(input().value, '');
        await render({ query: '日本語 <script> "引用"' });
        assert.equal(input().value, '日本語 <script> "引用"');
        await render({ query: false });
        assert.equal(input().value, '初期値');
        await act(async () => {
            Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input(), '検索文字列');
            input().dispatchEvent(new dom.window.Event('input', { bubbles: true }));
        });
        assert.equal(input().value, '検索文字列');
        assert.deepEqual(events, [{ type: 'change', id: 'query', value: '検索文字列' }]);
        await render({ query: '外部更新' });
        assert.equal(input().value, '外部更新');
        const composingInput = input();
        await act(async () => {
            composingInput.dispatchEvent(new dom.window.CompositionEvent('compositionstart', { bubbles: true }));
            Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(composingInput, '日本語変換');
            composingInput.dispatchEvent(new dom.window.InputEvent('input', { bubbles: true, isComposing: true }));
            composingInput.dispatchEvent(new dom.window.CompositionEvent('compositionend', { bubbles: true, data: '日本語変換' }));
        });
        assert.equal(input(), composingInput);
        assert.deepEqual(events.at(-1), { type: 'change', id: 'query', value: '日本語変換' });
        await render({ query: '日本語変換' });
        assert.equal(input(), composingInput);
        assert.equal(input().value, '日本語変換');
        await render();
        assert.equal(input().value, '初期値');
        assert.deepEqual(warnings, []);
    } finally {
        await act(async () => root.unmount());
        console.error = previousError;
    }
});

test('Form collects displayed typed values, isolates forms, and prevents native submission', async () => {
    const events: unknown[] = [];
    const source = [
        '<Form id="settings" action="apply-settings">',
        '<Card title="Settings">',
        '<Input id="query" default="初期値" />', '',
        '<Slider id="threshold" default="65" />', '',
        '<Checkbox id="archived" default="false" />', '',
        '<Select id="period">', '<Option value="day">', 'Day', '</Option>', '</Select>', '',
        '<Select id="empty">', '</Select>', '',
        '<Input />', '',
        '<Button type="submit" action="ignored">Apply</Button>', '',
        '<Button action="refresh-report">Refresh</Button>',
        '</Card>', '</Form>', '',
        '<Form id="other" action="other">', '<Input id="outside" default="excluded" />', '</Form>',
    ].join('\n');
    const ssr = renderToStaticMarkup(createElement(InkstreamMarkdown, { children: source, generativeUi: true }));
    assert.match(ssr, /<fieldset disabled="">/);
    assert.doesNotMatch(ssr, /action="apply-settings"/);
    const root = createRoot(document.getElementById('root')!);
    const render = async (values?: Record<string, string | number | boolean>) => {
        await act(async () => root.render(createElement(InkstreamMarkdown, { children: source, generativeUi: true, generativeUiValues: values, onGenerativeUiEvent: e => events.push(e) })));
    };
    try {
        await render();
        const form = document.querySelector('form')!;
        assert.equal(form.querySelector('fieldset')!.disabled, false);
        await act(async () => (form.querySelector('button[type="submit"]') as HTMLButtonElement).click());
        assert.deepEqual(events, [{ type: 'submit', id: 'settings', action: 'apply-settings', values: { query: '初期値', threshold: 65, archived: false, period: 'day' } }]);
        await render({ query: '', threshold: 20, archived: true, period: 'day' });
        const submit = new dom.window.Event('submit', { bubbles: true, cancelable: true });
        await act(async () => form.dispatchEvent(submit));
        assert.equal(submit.defaultPrevented, true);
        assert.deepEqual(events.at(-1), { type: 'submit', id: 'settings', action: 'apply-settings', values: { query: '', threshold: 20, archived: true, period: 'day' } });
        await act(async () => (form.querySelector('button[type="button"]') as HTMLButtonElement).click());
        assert.deepEqual(events.at(-1), { type: 'action', action: 'refresh-report' });
        await render();
        const input = form.querySelector('input[type="text"]') as HTMLInputElement;
        Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, 'edited');
        await act(async () => form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
        assert.equal((events.at(-1) as { values: { query: string } }).values.query, 'edited');
    } finally { await act(async () => root.unmount()); }
});

test('Form rejects duplicate IDs, hides nested forms, and disables invalid forms and outside submit', async () => {
    const events: unknown[] = [];
    const root = createRoot(document.getElementById('root')!);
    const source = [
        '<Button type="submit">Outside</Button>', '',
        '<Form id="duplicate" action="save">', '<Input id="same" />', '', '<Checkbox id="same" />', '',
        '<Form id="inner" action="inner">', '<Input id="nested" />', '</Form>',
        '<Button type="submit">Save</Button>', '</Form>', '',
        '<Form id="invalid">', '<Input id="invalid-field" />', '</Form>', '',
        '<Form id="empty" action="save">', '<Button type="submit">Empty</Button>', '</Form>',
    ].join('\n');
    try {
        await act(async () => root.render(createElement(InkstreamMarkdown, { children: source, generativeUi: true, onGenerativeUiEvent: e => events.push(e) })));
        assert.equal(document.querySelectorAll('form').length, 3);
        assert.equal(document.querySelector('#nested'), null);
        assert.equal(document.querySelector('button')!.disabled, true);
        const forms = document.querySelectorAll('form');
        assert.equal(forms[1].querySelector('fieldset')!.disabled, true);
        await act(async () => {
            forms[0].dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
            forms[1].dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
        });
        assert.deepEqual(events, []);
        await act(async () => forms[2].dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
        assert.deepEqual(events, [{ type: 'submit', id: 'empty', action: 'save', values: {} }]);
    } finally { await act(async () => root.unmount()); }
});

test('Form hydrates disabled SSR controls without warnings and enables submission', async () => {
    const { hydrateRoot } = await import('react-dom/client');
    const source = '<Form id="hydrate" action="save">\n<Input id="text" default="日本語" />\n\n<Button type="submit">Save</Button>\n</Form>';
    const props = { children: source, generativeUi: true };
    const container = document.getElementById('root')!;
    container.innerHTML = renderToStaticMarkup(createElement(InkstreamMarkdown, props));
    assert.equal(container.querySelector('fieldset')!.disabled, true);
    const warnings: unknown[] = [];
    const errors: unknown[] = [];
    const previousError = console.error;
    console.error = (...args) => warnings.push(args);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
        await act(async () => { root = hydrateRoot(container, createElement(InkstreamMarkdown, props), { onRecoverableError: e => errors.push(e) }); });
        assert.equal(container.querySelector('fieldset')!.disabled, false);
        assert.equal(container.querySelector('input')!.value, '日本語');
        assert.deepEqual(errors, []);
        assert.deepEqual(warnings, []);
    } finally {
        if (root) await act(async () => root!.unmount());
        console.error = previousError;
    }
});

test('streaming disables all default controls and suppresses events until completion', async () => {
    const source = [
        '<Button action="refresh">Refresh</Button>', '',
        '<Input id="outside" default="outside" />', '',
        '<Form id="settings" action="save">',
        '<Input id="query" default="初期" />', '',
        '<Slider id="threshold" default="65" />', '',
        '<Checkbox id="archived" />', '',
        '<Select id="period">', '<Option value="day">', 'Day', '</Option>', '</Select>', '',
        '<Button type="submit">Save</Button>', '</Form>',
    ].join('\n');
    const events: unknown[] = [];
    const root = createRoot(document.getElementById('root')!);
    const render = async (streaming?: boolean, query?: string) => {
        await act(async () => root.render(createElement(InkstreamMarkdown, {
            children: source, generativeUi: true, streaming,
            generativeUiValues: query === undefined ? undefined : { query },
            onGenerativeUiEvent: e => events.push(e),
        })));
    };
    try {
        await render(true, '外部値');
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button'));
        assert.ok(inputs.every(c => c.disabled));
        assert.equal(document.querySelector('fieldset')!.disabled, true);
        const query = document.getElementById('query') as HTMLInputElement;
        await render(true, '生成中の更新');
        assert.equal(document.getElementById('query'), query);
        assert.equal(query.value, '生成中の更新');
        const submit = new dom.window.Event('submit', { bubbles: true, cancelable: true });
        await act(async () => {
            document.querySelector('button')!.click();
            document.querySelector('form')!.dispatchEvent(submit);
            const text = document.getElementById('outside') as HTMLInputElement;
            Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(text, 'synthetic');
            text.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
            const select = document.querySelector('select')!;
            select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
            const range = document.getElementById('threshold') as HTMLInputElement;
            Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(range, '25');
            range.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
        });
        assert.equal(submit.defaultPrevented, true);
        assert.deepEqual(events, []);
        await render(false, '生成中の更新');
        assert.ok(inputs.every(c => !c.disabled));
        assert.equal(document.querySelector('fieldset')!.disabled, false);
        assert.equal(document.getElementById('query'), query);
        assert.deepEqual(events, []);
        await act(async () => {
            document.querySelector('button')!.click();
            document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
        });
        assert.equal(events.length, 2);
        assert.deepEqual(events[0], { type: 'action', action: 'refresh' });
        assert.equal((events[1] as { type: string }).type, 'submit');
    } finally { await act(async () => root.unmount()); }
});

test('streaming toggles preserve uncontrolled values and append updates preserve focus', async () => {
    const root = createRoot(document.getElementById('root')!);
    const open = '<Form id="settings" action="save">\n<Input id="query" default="初期" />';
    const render = async (source: string, streaming: boolean) => {
        await act(async () => root.render(createElement(InkstreamMarkdown, { children: source, generativeUi: true, streaming })));
    };
    try {
        await render(open, false);
        const input = document.getElementById('query') as HTMLInputElement;
        input.value = '利用者入力';
        await render(open + '\n<Slider min="0" max="', true);
        assert.equal(document.getElementById('query'), input);
        assert.equal(input.value, '利用者入力');
        assert.equal(input.disabled, true);
        await render(open + '\n</Form>', false);
        assert.equal(document.getElementById('query'), input);
        assert.equal(input.value, '利用者入力');
        assert.equal(input.disabled, false);
        input.focus();
        input.setSelectionRange(2, 2);
        await render(open + '\n</Form>\n\n後続の文章', false);
        assert.equal(document.getElementById('query'), input);
        assert.equal(document.activeElement, input);
        assert.equal(input.selectionStart, 2);
        assert.equal(input.value, '利用者入力');
    } finally { await act(async () => root.unmount()); }
});

test('streaming SSR hydrates consistently and preserves existing invalid controls', async () => {
    const { hydrateRoot } = await import('react-dom/client');
    const source = '<Button type="submit">Outside</Button>\n\n<Button>No action</Button>\n\n<Input id="outside" />\n\n<Form id="invalid">\n<Input id="inside" />\n</Form>';
    const props = { children: source, generativeUi: true, streaming: true };
    const container = document.getElementById('root')!;
    container.innerHTML = renderToStaticMarkup(createElement(InkstreamMarkdown, props));
    assert.ok(Array.from(container.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button')).every(c => c.disabled));
    const errors: unknown[] = [];
    const warnings: unknown[] = [];
    const previousError = console.error;
    console.error = (...args) => warnings.push(args);
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
        await act(async () => { root = hydrateRoot(container, createElement(InkstreamMarkdown, props), { onRecoverableError: e => errors.push(e) }); });
        assert.equal(container.querySelector('fieldset')!.disabled, true);
        await act(async () => root!.render(createElement(InkstreamMarkdown, { ...props, streaming: false })));
        assert.ok(Array.from(container.querySelectorAll('button')).every(c => c.disabled));
        assert.equal(container.querySelector('fieldset')!.disabled, true);
        assert.equal((document.getElementById('outside') as HTMLInputElement).disabled, false);
        assert.deepEqual(errors, []);
        assert.deepEqual(warnings, []);
    } finally {
        if (root) await act(async () => root!.unmount());
        console.error = previousError;
    }
});

test('streaming suppresses context notifications from a custom renderer', async () => {
    const { useGenerativeUiContext } = await import('../src/react/generative-ui-context.js');
    function CustomButton() {
        const { onEvent } = useGenerativeUiContext();
        return createElement('button', { onClick: () => onEvent?.({ type: 'action', action: 'custom' }) }, 'Custom');
    }
    const root = createRoot(document.getElementById('root')!);
    const events: unknown[] = [];
    const render = async (streaming: boolean) => {
        await act(async () => root.render(createElement(InkstreamMarkdown, {
            children: '<Button action="custom">Custom</Button>', generativeUi: true, streaming,
            components: { button: CustomButton }, onGenerativeUiEvent: e => events.push(e),
        })));
    };
    try {
        await render(true);
        await act(async () => document.querySelector('button')!.click());
        assert.deepEqual(events, []);
        await render(false);
        await act(async () => document.querySelector('button')!.click());
        assert.deepEqual(events, [{ type: 'action', action: 'custom' }]);
    } finally { await act(async () => root.unmount()); }
});
