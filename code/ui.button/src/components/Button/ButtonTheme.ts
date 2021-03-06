import { COLORS, R, t } from '../common';

/**
 * The base button theme.
 */
const BASE: t.IButtonTheme = {
  color: { enabled: COLORS.BLUE, disabled: -0.6 },
  backgroundColor: {},
  disabledOpacity: 0.3,
  border: {
    isVisible: false,
    thickness: 1,
    padding: [6, 15, 5, 15],
    radius: 3,
    color: -0.1,
  },
};

export const ButtonTheme = {
  /**
   * [Static.Methods]
   */
  merge(base: t.IButtonTheme, theme: Partial<t.IButtonTheme>) {
    const res = R.mergeDeepRight(base, theme) as t.IButtonTheme;
    return R.clone(res);
  },

  /**
   * [Static.Properties]
   */
  get BASE() {
    return R.clone(BASE);
  },

  get BORDER() {
    const border = { ...BASE.border, isVisible: true };
    const BORDER = {
      get BASE() {
        return ButtonTheme.merge(BASE, { border });
      },
      get SOLID() {
        const theme = BORDER.BASE;
        theme.backgroundColor.enabled = COLORS.BLUE;
        theme.backgroundColor.disabled = -0.1;
        theme.color = { enabled: 1, disabled: -0.3 };
        return theme;
      },
      get BLUE() {
        return BORDER.SOLID;
      },
      get GREEN() {
        const theme = BORDER.SOLID;
        theme.backgroundColor.enabled = COLORS.GREEN;
        return theme;
      },
      get WHITE() {
        const theme = BORDER.SOLID;
        theme.backgroundColor.enabled = COLORS.WHITE;
        theme.color.enabled = COLORS.DARK;
        return theme;
      },
      get DARK() {
        const theme = BORDER.SOLID;
        theme.backgroundColor.enabled = COLORS.DARK;
        return theme;
      },
      merge(theme: Partial<t.IButtonTheme>, base?: t.IButtonTheme) {
        return ButtonTheme.merge(base || BORDER.BASE, theme);
      },
    };

    return BORDER;
  },
};
