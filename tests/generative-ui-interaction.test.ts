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
