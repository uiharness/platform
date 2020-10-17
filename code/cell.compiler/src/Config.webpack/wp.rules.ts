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
    return {
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-typescript',
              {
                /**
                 * NB: This is important for proper typescript file watching
                 *     See:
                 *       - https://github.com/TypeStrong/fork-ts-checker-webpack-plugin#type-only-modules-watching
                 *       - https://github.com/TypeStrong/fork-ts-checker-webpack-plugin/blob/master/examples/babel-loader/.babelrc.js
                 *       - https://babeljs.io/docs/en/babel-preset-typescript#onlyremovetypeimports
                 */
                onlyRemoveTypeImports: true,
              },
            ],
            '@babel/preset-react',
            '@babel/preset-env',
          ],
          plugins: ['@babel/plugin-proposal-class-properties'],
        },
      },
    };
  },
};
