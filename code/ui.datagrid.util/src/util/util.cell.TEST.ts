import { expect } from 'chai';

import { t } from '../common';
import * as util from './util.cell';

describe('util.cell', () => {
  describe('toCellProps', () => {
    const A2: t.IGridCellData = {
      value: 'Hello',
      props: {
        value: 456, // NB: Display value.
        style: { bold: true },
        merge: { colspan: 3 },
        view: { screen: { type: 'SHOP' } },
      },
    };

    it('default props (empty {})', () => {
      const test = (input?: any) => {
        const res = util.toGridCellProps(input);
        expect(res.value).to.eql(undefined);
        expect(res.merge).to.eql({});
        expect(res.style).to.eql({});
        expect(res.view).to.eql({});
      };
      test();
      test(null);
      test({});
    });

    it('from [cell.props]', () => {
      const props = util.toGridCellProps(A2.props);
      expect(props.style.bold).to.eql(true);
      expect(props.merge.colspan).to.eql(3);
      expect(props.value).to.eql(456);
      expect(props.view.screen && props.view.screen.type).to.eql('SHOP');
    });

    it('from [cell]', () => {
      const props = util.toGridCellProps(A2);
      expect(props.style.bold).to.eql(true);
      expect(props.merge.colspan).to.eql(3);
      expect(props.value).to.eql(456);
      expect(props.view.screen && props.view.screen.type).to.eql('SHOP');
    });
  });
});
