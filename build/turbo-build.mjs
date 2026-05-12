// Build script · sprint H · @alvaro 2026-05-10
// Bundleja @ardrive/turbo-sdk amb polyfills Node per fer-lo browser-compatible.
// Output: vendor/turbo-sdk.js (ESM · ~600KB).

import * as esbuild from 'esbuild';
import { polyfillNode } from 'esbuild-plugin-polyfill-node';

await esbuild.build({
    entryPoints: ['build/turbo-entry.mjs'],
    bundle: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    outfile: 'vendor/turbo-sdk.js',
    minify: true,
    sourcemap: false,
    treeShaking: true,
    define: {
        'process.env.NODE_ENV': '"production"',
        'global': 'globalThis',
    },
    plugins: [
        polyfillNode({
            globals: { buffer: true, process: true },
            polyfills: {
                fs: false,           // skip · no browser usage in publish
                'fs/promises': false,
                child_process: false,
                stream: true,
                crypto: true,
                buffer: true,
                process: true,
                util: true,
                events: true,
                path: true,
                url: true,
            },
        }),
    ],
    logLevel: 'info',
});

console.log('\n✓ vendor/turbo-sdk.js generat');
