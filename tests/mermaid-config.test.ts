import assert from 'node:assert/strict';
import test from 'node:test';
import { createMermaidConfig } from '../src/react/mermaid-diagram.js';

test('uses Mermaid 12 defaults for light mode', () => {
    assert.deepEqual(createMermaidConfig(false), {
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'redux-color',
        look: 'neo',
        layout: 'elk',
    });
});

test('uses Mermaid 12 dark colors in dark mode', () => {
    assert.equal(createMermaidConfig(true).theme, 'redux-dark-color');
});
