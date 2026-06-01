import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import CopyPlugin from 'copy-webpack-plugin';
import type { Configuration } from 'webpack';
import { makeBaseConfig } from '../../webpack.base.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (_env: Record<string, unknown>, argv: Record<string, unknown>): Configuration[] => {
  const isProd = argv.mode === 'production';
  const base = makeBaseConfig(isProd, resolve(__dirname, 'tsconfig.json'));

  const webviewConfig: Configuration = {
    ...base,
    target: 'web',
    entry: './src/App.tsx',
    devtool: isProd ? 'source-map' : 'inline-source-map',
    output: {
      path: resolve(__dirname, 'dist'),
      filename: 'frontend.js',
      devtoolModuleFilenameTemplate: (info) => {
        return `file://${resolve(info.absoluteResourcePath).replace(/\\/g, '/')}`;
      },
    },
    plugins: [
      new CopyPlugin({
        patterns: [{ from: resolve(__dirname, 'src/styles.css'), to: 'styles.css' }],
      }),
    ],
    cache: {
      type: 'filesystem',
      buildDependencies: { config: [__filename] },
      name: isProd ? 'prod-webview' : 'dev-webview',
    },
  };

  return [webviewConfig];
};
