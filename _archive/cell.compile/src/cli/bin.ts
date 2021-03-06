#!/usr/bin/env node

import * as compile from './cmd.compile';
import { cli, constants } from './common';
const log = cli.log;

/**
 * Makes the script crash on unhandled rejections instead of silently
 * ignoring them. In the future, promise rejections that are not handled will
 * terminate the Node.js process with a non-zero exit code.
 */
process.on('unhandledRejection', (err) => {
  throw err;
});

/**
 * Create a new "command-line-interface" application and register commands.
 */
const app = cli.create('cell');
compile.init(app.plugins);

// Log header (meta-data).
const PKG = constants.PKG;
const header = `${PKG.name}@${PKG.version}`;
log.info.gray(`${header}\n${log.magenta('━'.repeat(header.length))}\n`);

/**
 * Run the application.
 */
app.run();
