// Run: CHROME_BIN=/path/to/chromium node --test tests/browser/html-embed.test.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server;
let chrome;
let profile;
let socket;
let endpoint;
let nextId = 0;
const pending = new Map();
const contexts = new Map();

function call(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            pending.delete(id);
            reject(new Error('CDP timeout: ' + method));
        }, 10000);
        pending.set(id, {
            resolve: value => { clearTimeout(timeout); resolve(value); },
            reject: error => { clearTimeout(timeout); reject(error); },
        });
        socket.send(JSON.stringify({ id, method, params }));
    });
}

async function evaluate(expression, contextId) {
    const result = await call('Runtime.evaluate', { expression, contextId, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
}

async function until(expression, message) {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
        if (await evaluate(expression)) return;
        await new Promise(resolve => setTimeout(resolve, 30));
    }
    assert.fail(message + ': ' + JSON.stringify(await evaluate('({url:location.href,text:document.body.innerText.slice(0,500)})')));
}

before(async () => {
    assert.ok(process.env.CHROME_BIN, 'Set CHROME_BIN to an installed Chromium executable');
    server = await createServer({
        configFile: false,
        server: { host: '127.0.0.1', port: 0 },
        optimizeDeps: { include: ['react', 'react-dom/client'] },
        plugins: [{
            name: 'html-embed-browser-fixture',
            configureServer(vite) {
                vite.middlewares.use((req, res, next) => {
                    if (!req.url?.startsWith('/embed-test?')) return next();
                    res.setHeader('Content-Type', 'text/html');
                    res.end('<!doctype html><div id="root"></div><script type="module" src="/tests/browser/html-embed.fixture.tsx"></script>');
                });
            },
        }],
    });
    await server.listen();
    const address = server.httpServer.address();
    endpoint = 'http://127.0.0.1:' + address.port;
    profile = await mkdtemp(path.join(tmpdir(), 'inkstream-browser-'));
    chrome = spawn(process.env.CHROME_BIN, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-site-isolation-trials', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const browserUrl = await new Promise((resolve, reject) => {
        let stderr = '';
        const timeout = setTimeout(() => reject(new Error('Chromium startup timeout: ' + stderr)), 10000);
        chrome.once('error', error => { clearTimeout(timeout); reject(error); });
        chrome.stderr.on('data', chunk => {
            stderr += chunk;
            const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
            if (match) { clearTimeout(timeout); resolve(match[1]); }
        });
    });
    const browserAddress = new URL(browserUrl);
    const targets = await (await fetch('http://' + browserAddress.host + '/json/list')).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await once(socket, 'open');
    socket.addEventListener('message', ({ data }) => {
        const message = JSON.parse(data);
        if (message.method === 'Runtime.exceptionThrown') console.error(JSON.stringify(message.params));
        if (message.method === 'Runtime.executionContextCreated') {
            const context = message.params.context;
            contexts.set(context.id, context);
        }
        if (message.method === 'Runtime.executionContextDestroyed') contexts.delete(message.params.executionContextId);
        if (message.method === 'Runtime.executionContextsCleared') contexts.clear();
        const request = pending.get(message.id);
        if (request) {
            pending.delete(message.id);
            if (message.error) request.reject(new Error(JSON.stringify(message.error)));
            else request.resolve(message.result);
        }
    });
    await call('Page.enable');
    await call('Runtime.enable');
    await call('Emulation.setDeviceMetricsOverride', { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
});

after(async () => {
    socket?.close();
    if (chrome && chrome.exitCode === null) {
        const exited = once(chrome, 'exit');
        chrome.kill();
        await exited;
    }
    await server?.close();
    if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

async function load(scenario) {
    await call('Page.navigate', { url: endpoint + '/embed-test?scenario=' + scenario });
    await until('document.querySelector("iframe") !== null', 'React iframe did not mount');
    await until('parseFloat(document.querySelector("iframe").style.height) !== 500', 'iframe never reported its initial content height');
}

const height = () => evaluate('document.querySelector("iframe").getBoundingClientRect().height');

test('viewport-relative content settles instead of growing on every resize', async () => {
    await load('viewport');
    const initial = await height();
    await new Promise(resolve => setTimeout(resolve, 500));
    const later = await height();

    assert.ok(later <= initial + 1, 'iframe kept growing: ' + initial + 'px -> ' + later + 'px');
    assert.ok(later < 100000, 'iframe reached the safety cap instead of settling');
});

test('absolutely positioned content is fully visible', async () => {
    await load('absolute');

    assert.ok(await height() >= 832, '800px absolute content plus 32px body padding must fit; actual height=' + await height());
});

test('normal-flow content can grow and shrink after its initial render', async () => {
    await load('changing');
    assert.equal(await height(), 232);
    const tree = await call('Page.getFrameTree');
    const frameId = tree.frameTree.childFrames[0].frame.id;
    const context = [...contexts.values()].find(value => value.auxData?.frameId === frameId && value.auxData?.isDefault);
    assert.ok(context, 'Missing sandbox frame execution context');

    await evaluate('document.body.firstElementChild.style.height = "800px"', context.id);
    await until('document.querySelector("iframe").getBoundingClientRect().height === 832', 'iframe did not grow to 832px');

    await evaluate('document.body.firstElementChild.style.height = "100px"', context.id);
    await until('document.querySelector("iframe").getBoundingClientRect().height === 132', 'iframe did not shrink to 132px');
});

test('absolute content can grow and shrink without changing its normal-flow parent', async () => {
    await load('absolute');
    const tree = await call('Page.getFrameTree');
    const frameId = tree.frameTree.childFrames[0].frame.id;
    const context = [...contexts.values()].find(value => value.auxData?.frameId === frameId && value.auxData?.isDefault);
    assert.ok(context);

    await evaluate('document.body.firstElementChild.firstElementChild.style.height = "1000px"', context.id);
    await until('document.querySelector("iframe").getBoundingClientRect().height === 1032', 'absolute content did not grow');

    await evaluate('document.body.firstElementChild.firstElementChild.style.height = "100px"', context.id);
    await until('document.querySelector("iframe").getBoundingClientRect().height === 132', 'absolute content did not shrink');
});

test('viewport width changes still remeasure responsive content', async () => {
    await load('responsive');
    assert.equal(await height(), 232);

    await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 1, mobile: false });
    await until('document.querySelector("iframe").getBoundingClientRect().height === 432', 'narrow viewport did not expand content');

    await call('Emulation.setDeviceMetricsOverride', { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
    await until('document.querySelector("iframe").getBoundingClientRect().height === 232', 'wide viewport did not shrink content');
});
