/* eslint-disable react/display-name */
import * as React from 'react';

import { constants, id, Module, t } from '../common';
import { Layout } from '../components/Body';
import { Window } from '../components/Window';
import { builder } from '../language';
import { strategy } from '../strategy';

type P = t.ShellProps;

export const Shell: t.Shell = {
  Window: (props) => <Window {...props} />,
  Body: (props) => <Layout {...props} />,

  /**
   * API builder (DSL).
   */
  builder,

  /**
   * Shell module initialization.
   */
  module(bus, options: t.ShellOptions = {}) {
    const shell = Module.create<P>({
      bus,
      kind: constants.KIND,
      root: {
        id: `${id.shortid()}.shell`,
        props: { data: constants.DEFAULT.DATA },
      },
    });
    strategy({ ...options, shell, bus });
    return shell;
  },
};
