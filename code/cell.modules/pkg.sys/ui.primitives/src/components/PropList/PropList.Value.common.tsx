import React, { useState } from 'react';

import { color, COLORS, css } from '../../common';
import { Icons } from '../Icons';

/**
 * Copy icon.
 */
export const CopyIcon: React.FC = (props) => {
  const styles = {
    base: css({ Absolute: [2, -12, null, null], opacity: 0.8 }),
  };
  return <Icons.Copy style={styles.base} color={COLORS.DARK} size={10} />;
};
