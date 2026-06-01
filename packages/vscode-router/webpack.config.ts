import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Configuration } from 'webpack';
import webpack from 'webpack';
import { makeBaseConfig } from '../../webpack.base.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default (_env: Record<string, unknown>, argv: Record<string, unknown>): Configuration[] => {
  const isProd = argv.mode === 'production';
  const base = makeBaseConfig(isProd, resolve(__dirname, 'tsconfig.json'));

  const routerConfig: Configuration = {
    ...base,
    target: 'node20',
    entry: './src/index.ts',
    output: {
      path: resolve(__dirname, 'dist'),
      filename: 'router.cjs',
      library: { type: 'commonjs2' },
    },
    cache: {
      type: 'filesystem',
      buildDependencies: { config: [__filename] },
      name: isProd ? 'prod-router' : 'dev-router',
    },
    externalsPresets: { node: true },
    ignoreWarnings: [
      {
        module: /node_modules\/hono\/dist\/utils\/color\.js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ],
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /^(bufferutil|utf-8-validate)$/,
      }),
    ],
  };

  return [routerConfig];
};
