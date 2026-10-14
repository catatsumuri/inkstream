import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    root: 'site',
    base: './',
    build: {
        outDir: '../site-dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                appIntegration: fileURLToPath(
                    new URL('./app-integration.html', import.meta.url),
                ),
            },
        },
    },
});
