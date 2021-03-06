import { ICommand } from '@platform/cli.spec/lib/types';

export * from '@platform/cli.spec/lib/types';

export * from './components/CommandPrompt/types';
export * from './components/CommandTree/types';
export * from './components/CommandShell/types';

/**
 * [Events]
 */
export type CommandClickEvent = { cmd: ICommand };
export type CommandClickEventHandler = (e: CommandClickEvent) => void;
