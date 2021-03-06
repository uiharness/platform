import { run } from '../exec/cmd.run';
import { IRunOptions } from '../common';

export type ICommandPart = {
  value: string;
  type: 'COMMAND' | 'FLAG' | 'ARG';
};

/**
 * Builds an executable string command.
 */
export class Command {
  /**
   * [Static]
   */
  public static create(value?: string) {
    const cmd = new Command({ parts: [] });
    return value ? cmd.add(value) : cmd;
  }

  /**
   * [Constructor]
   */
  private constructor(args: { parts: ICommandPart[] }) {
    this._.parts = [...args.parts];
  }

  /**
   * [Fields]
   */
  private readonly _ = {
    parts: [] as ICommandPart[],
  };

  /**
   * [Properties]
   */
  public get parts() {
    return [...this._.parts];
  }

  /**
   * [Methods]
   */
  public add(value: string, conditional?: boolean) {
    conditional = conditional === undefined ? true : conditional;
    if (!conditional) {
      return this;
    }
    value = value.replace(/\n/g, '').trim();
    this._.parts = [...this._.parts, { value, type: toPartType(value) }];
    return this;
  }

  public newLine(value?: string, conditional?: boolean) {
    conditional = conditional === undefined ? true : conditional;
    if (!conditional) {
      return this;
    }

    const parts = [...this.parts];
    if (parts.length === 0) {
      return this;
    }
    const last = { ...parts[parts.length - 1] };
    last.value += '\n';
    parts[parts.length - 1] = last;
    this._.parts = parts;

    if (value) {
      this.add(value);
    }

    return this;
  }

  public run(options?: IRunOptions) {
    return run(this.toString(), options);
  }

  public clone() {
    const parts = this.parts;
    return new Command({ parts });
  }

  public toString() {
    return this.parts.map((p) => p.value).join(' ');
  }
}

/**
 * INTERNAL
 */
const toPartType = (value: string): ICommandPart['type'] => {
  if (value.startsWith('-')) {
    return value.includes('=') || value.includes(' ') ? 'ARG' : 'FLAG';
  }

  return 'COMMAND';
};
