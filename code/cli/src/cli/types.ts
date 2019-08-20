import * as t from '../types';
import { Argv } from 'yargs';

export type ICli = {
  program: Argv<{}>;
  command: Argv<{}>['command'];
  option: Argv<{}>['option'];
  task: t.AddTask;
  skip: t.AddTask;
  exit(code: number): void;
  run(): void;
};
