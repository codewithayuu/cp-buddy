import { resolve } from 'node:path';
import { defineConfig } from 'wxt';
import { allDomains } from './src/submitters/domains';

const buildHostPermissions = (): string[] => {
  const patterns = new Set<string>(['*://localhost/*']);
  for (const domain of allDomains) patterns.add(`*://${domain}/*`);
  return [...patterns].sort();
};

export default defineConfig({
  srcDir: '.',
  entrypointsDir: 'entrypoints',
  publicDir: 'public',
  outDir: 'dist',
  imports: false,
  webExt: { disabled: true },
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: resolve(__dirname, '../core/res/cpbuddy.png'),
  },
  zip: {
    name: 'cpbuddy-submit',
  },
  manifest: ({ browser }) => {
    const hostPermissions = buildHostPermissions();
    const permissions = ['activeTab', 'storage', 'scripting', 'notifications'];
    if (browser === 'chrome') permissions.push('offscreen');

    return {
      name: '__MSG_appName__',
      description: '__MSG_appDescription__',
      permissions,
      host_permissions: hostPermissions,
      default_locale: 'en',
      web_accessible_resources: [
        {
          resources: ['/icons/128.png'],
          matches: ['<all_urls>'],
        },
        {
          resources: ['/assets/*'],
          matches: ['<all_urls>'],
        },
      ],
      ...(browser === 'firefox'
        ? {
            browser_specific_settings: {
              gecko: {
                id: 'submit@cpbuddy.dev',
                strict_min_version: '109.0',
                data_collection_permissions: {
                  required: ['none'],
                },
              },
            },
          }
        : {}),
    };
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      if (manifest.content_scripts) {
        for (const cs of manifest.content_scripts) {
          cs.matches = buildHostPermissions();
        }
      }
    },
    'build:publicAssets': async (_wxt, files) => {
      files.push({
        absoluteSrc: resolve('node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs'),
        relativeDest: `assets/onnx-wasm/ort-wasm-simd-threaded.mjs`,
      });
      files.push({
        absoluteSrc: resolve('node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm'),
        relativeDest: `assets/onnx-wasm/ort-wasm-simd-threaded.wasm`,
      });
    },
    'prepare:publicPaths': (_wxt, paths) => {
      paths.push('assets/onnx-wasm/ort-wasm-simd-threaded.mjs');
      paths.push('assets/onnx-wasm/ort-wasm-simd-threaded.wasm');
    },
  },
  vite: () => ({
    resolve: {
      alias: {
        '@b': resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          warn(warning);
        },
      },
    },
  }),
});
