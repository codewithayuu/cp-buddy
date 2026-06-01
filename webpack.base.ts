// biome-ignore-all lint/style/useNamingConvention: Terser API requires snake_case

import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import type { Configuration } from 'webpack';

export const makeBaseConfig = (
  isProd: boolean,
  tsconfigPath: string,
): Configuration => ({
  mode: isProd ? 'production' : 'development',
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: tsconfigPath,
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: true,
              },
              target: 'es2020',
              transform: { react: { runtime: 'automatic' } },
            },
          },
        },
      },
    ],
  },
  optimization: {
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        parallel: true,
        terserOptions: {
          format: { comments: false },
          compress: { drop_console: isProd, drop_debugger: true },
        },
      }),
    ],
  },
  performance: {
    maxEntrypointSize: 2 * 1024 * 1024,
    maxAssetSize: 2 * 1024 * 1024,
  },
});
