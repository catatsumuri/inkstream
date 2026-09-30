import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

// A peer marked `optional` promises that the package still loads when it is
// missing. That only holds if nothing on the eager import path needs it, so
// value imports of an optional peer are allowed only in modules that are
// themselves loaded lazily (`await import('./x.js')`).
//
// `react` and `react-markdown` are exempt: they are optional only because
// core-only (non-React) consumers never load the `/react` entry at all.

const root = join(import.meta.dirname, '..');
const reactDir = join(root, 'src', 'react');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    peerDependenciesMeta: Record<string, { optional?: boolean }>;
};
const optionalPeers = Object.entries(pkg.peerDependenciesMeta)
    .filter(([, meta]) => meta.optional)
    .map(([name]) => name)
    .filter((name) => !['react', 'react-markdown'].includes(name));

const files = readdirSync(reactDir).filter((name) => /\.tsx?$/.test(name));
const source = (name: string): string =>
    readFileSync(join(reactDir, name), 'utf8');

const lazilyLoaded = new Set<string>();

for (const name of files) {
    for (const match of source(name).matchAll(/import\('\.\/([\w-]+)\.js'\)/g)) {
        lazilyLoaded.add(`${match[1]}`);
    }
}

// `import x from 'pkg'` / `import { x } from 'pkg/sub'` but not `import type`.
const staticValueImport = (code: string, peer: string): boolean =>
    new RegExp(
        `^import\\s+(?!type\\b)[^;]*?from\\s+'${peer}(?:/[^']*)?'`,
        'm',
    ).test(code);

test('optional peers are only value-imported from lazily loaded modules', () => {
    for (const peer of optionalPeers) {
        for (const name of files) {
            if (!staticValueImport(source(name), peer)) {
                continue;
            }

            assert.ok(
                lazilyLoaded.has(name.replace(/\.tsx?$/, '')),
                `${name} statically imports optional peer "${peer}" but is not loaded lazily; ` +
                    `either make the peer required or load the module with import()`,
            );
        }
    }
});

test('lucide-react is a required peer because /react imports it eagerly', () => {
    const importsLucide = files.some((name) =>
        staticValueImport(source(name), 'lucide-react'),
    );

    assert.equal(importsLucide, true, 'expected /react to import lucide-react');
    assert.notEqual(pkg.peerDependenciesMeta['lucide-react']?.optional, true);
});
