import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { t, toSelectionValues, DEFAULT, util } from '../common';

const STYLE: t.GridStyleCommand[] = ['BOLD', 'ITALIC', 'UNDERLINE'];

/**
 * Manage style commands.
 */
export function init(args: {
  grid: t.IGrid;
  command$: Observable<t.IGridCommand>;
  fire: t.FireGridEvent;
}) {
  const { grid, command$, fire } = args;
  const style$ = command$.pipe(
    filter(e => STYLE.includes(e.command as any)),
    filter(e => !e.isCancelled),
  );

  style$.subscribe(e => {
    const command = e.command as t.GridStyleCommand;
    const field = toField(command);
    const values = toSelectionValues({ values: grid.values, selection: e.selection });
    const defaults = DEFAULT.CELL.PROPS.style;

    // Converts values to the toggled style.
    const changes = Object.keys(values).reduce((acc, key) => {
      const cell = grid.cell(key);
      const value = cell.value;
      const props = util.toggleCellProp<'style'>({
        defaults,
        props: cell.props,
        section: 'style',
        field,
      });
      acc[key] = { value, props };
      return acc;
    }, {});

    // Update the grid.
    grid.changeCells(changes, { source: 'PROPS/style' });
  });
}

/**
 * [Helpers]
 */

const toField = (command: t.GridStyleCommand): keyof t.ICellPropsStyle => {
  switch (command) {
    case 'BOLD':
      return 'bold';
    case 'ITALIC':
      return 'italic';
    case 'UNDERLINE':
      return 'underline';

    default:
      throw new Error(`Command '${command}' not supported`);
  }
};
