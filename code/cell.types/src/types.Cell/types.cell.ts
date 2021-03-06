import { t } from '../common';
import { Diff } from '@platform/util.diff/lib/types';

/**
 * Cell
 */
export type ICellProps = {
  value?: t.CellValue; // The calculated display value if different from the raw cell value.
  type?: t.CellType;
};

export type ICellData<P extends ICellProps = ICellProps> = {
  value?: t.CellValue;
  props?: P;
  hash?: string;
  error?: t.IError;
  links?: t.IUriMap;
};

export type ICellDiff<P extends ICellProps = ICellProps> = {
  readonly left: ICellData<P>;
  readonly right: ICellData<P>;
  readonly isDifferent: boolean;
  readonly list: Diff<ICellData<P>>[];
};
