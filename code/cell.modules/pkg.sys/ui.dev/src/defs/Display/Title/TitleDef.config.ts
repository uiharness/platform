import { DEFAULT, format, slug, t } from '../common';

type O = Record<string, unknown>;

/**
 * A [Title] configurator.
 */
export function config<Ctx extends O>(ctx: Ctx, params: any[]) {
  const item: t.ActionTitle = { id: slug(), kind: 'display/title', text: DEFAULT.UNTITLED };

  const config: t.ActionTitleConfigArgs<any> = {
    ctx,
    text(value) {
      item.text = format.string(value, { trim: true }) || DEFAULT.UNTITLED;
      return config;
    },
    indent(value) {
      item.indent = format.number(value, { min: 0, default: 0 });
      return config;
    },
  };

  if (typeof params[0] === 'function') {
    params[0](config);
  }

  if (typeof params[0] === 'string') {
    config.text(params[0]);
    if (typeof params[1] === 'function') {
      params[1](config);
    }
  }

  return { item, config };
}
