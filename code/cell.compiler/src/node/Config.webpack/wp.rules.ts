import { t } from '../common';

type IArgs = { model: t.CompilerModel; prod: boolean; dev: boolean };

export const Rules = {
  /**
   * Initialize rules.
   */
  init(args: IArgs) {
    return Rules.default(args);
  },

  /**
   * Default preset.
   */
  default(args: IArgs): t.WpRule[] {
    return [Rules.css(args), Rules.typescript(args)];
  },

  /**
   * CSS (Stylesheets)
   */
  css(args: IArgs) {
    return {
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    };
  },

  /**
   * Typescript (language).
   */
  typescript(args: IArgs) {
    /**
     * 🌳 https://babeljs.io/docs/en/babel-preset-react
     */
    const presetReact = '@babel/preset-react';

    /**
     * 🌳 https://babeljs.io/docs/en/babel-preset-typescript
     */
    const presetTypescript = [
      '@babel/preset-typescript',
      {
        /**
         * NB: This is required for proper typescript file watching.
         *     See:
         *       - https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#type-only-modules-watching
         *       - https://github.com/TypeStrong/fork-ts-checker-webpack-plugin/blob/master/examples/babel-loader/.babelrc.js
         *       - https://babeljs.io/docs/en/babel-preset-typescript#onlyremovetypeimports
         */
        onlyRemoveTypeImports: true,
      },
    ];

    /**
     * 🌳 https://babeljs.io/docs/en/babel-preset-env
     */
    const presetEnv = [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage', // https://babeljs.io/docs/en/babel-preset-env#usebuiltins
        corejs: 3, // https://babeljs.io/docs/en/babel-preset-env#corejs
      },
    ];

    return {
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [presetTypescript, presetReact, presetEnv],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-modules-commonjs',
          ],
        },
      },
    };
  },
};