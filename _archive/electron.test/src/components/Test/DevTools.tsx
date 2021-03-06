import * as React from 'react';

import { css, CssValue, renderer } from '../../common';
import { Button, ObjectView } from '../primitives';
import { TestPanel } from '../TestPanel';

/**
 * Test component.
 */
export type IDevToolsTestProps = {
  style?: CssValue;
};

export class DevToolsTest extends React.PureComponent<IDevToolsTestProps> {
  public static contextType = renderer.Context;
  public context!: renderer.ReactContext;

  public render() {
    const styles = {
      base: css({ marginBottom: 50 }),
      columns: css({
        Flex: 'horizontal-start-spaceBetween',
      }),
      colButtons: css({
        lineHeight: '1.6em',
        Flex: 'vertical-start',
        paddingLeft: 15,
        flex: 1,
      }),
      colObject: css({
        flex: 1,
      }),
    };

    return (
      <TestPanel title={'DevTools'}>
        <div {...styles.columns}>
          <div {...styles.colButtons}>
            <Button label={'clearConsoles'} onClick={this.clearConsoles} />
            <Button label={'show (new)'} onClick={this.revealHandler(true)} />
            <Button label={'show (new) - focus'} onClick={this.revealHandler(true, true)} />
            <Button label={'hide'} onClick={this.revealHandler(false)} />
          </div>
          <div {...styles.colObject}>
            <ObjectView name={'context'} data={this.context} />
          </div>
        </div>
      </TestPanel>
    );
  }

  private revealHandler = (show: boolean, focus?: boolean) => {
    return () => {
      const { devTools } = this.context;
      if (show) {
        devTools.show({ focus });
      } else {
        devTools.hide();
      }
    };
  };

  private clearConsoles = () => {
    const { devTools } = this.context;
    devTools.clearConsoles();
  };
}
