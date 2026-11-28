import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { HtmlEmbed } from '../../src/react/html-embed.js';

const sources: Record<string, string> = {
    viewport: '<div style="min-height:100vh">viewport height</div>',
    absolute: '<div style="position:relative"><div style="position:absolute;top:0;height:800px;width:100px;background:red">absolute</div></div>',
    responsive: '<style>.box{height:200px}@media(max-width:600px){.box{height:400px}}</style><div class="box"></div>',
    changing: '<div style="height:200px;background:red"></div>',
};
const scenario = new URLSearchParams(location.search).get('scenario') ?? 'changing';
createRoot(document.getElementById('root')!).render(createElement(HtmlEmbed, { source: sources[scenario] }));
