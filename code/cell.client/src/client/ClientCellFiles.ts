import { ERROR, http, Schema, t, util } from '../common';

export type IClientCellFilesArgs = { parent: t.IClientCell; urls: t.IUrls };

/**
 * HTTP client for operating on a [Cell]'s files.
 */
export class ClientCellFiles implements t.IClientCellFiles {
  public static create(args: IClientCellFilesArgs): t.IClientCellFiles {
    return new ClientCellFiles(args);
  }

  /**
   * [Lifecycle]
   */
  private constructor(args: IClientCellFilesArgs) {
    this.args = args;
  }

  /**
   * [Fields]
   */
  private readonly args: IClientCellFilesArgs;

  /**
   * [Methods]
   */
  public async map() {
    type T = t.IClientResponse<t.IFileMap>;
    const parent = this.args.parent;
    const url = parent.url.files;

    const resFiles = await http.get(url.toString());
    if (!resFiles.ok) {
      const status = resFiles.status;
      const type = status === 404 ? ERROR.HTTP.NOT_FOUND : ERROR.HTTP.SERVER;
      const message = `Failed to get file map for '${parent.uri.toString()}'.`;
      return util.toError(status, type, message) as T;
    }

    const json = resFiles.json as t.IResGetCellFiles;
    const body = json.files;
    const res: T = { ok: true, status: 200, body };

    return res;
  }

  public async list() {
    type T = t.IClientResponse<t.IClientFileData[]>;
    const parent = this.args.parent;

    const resMap = await this.map();
    if (!resMap.ok) {
      return (resMap as unknown) as T;
    }

    const map = resMap.body;
    const ns = parent.uri.parts.ns;

    const body = Object.keys(map).reduce((acc, fileid) => {
      const value = map[fileid];
      if (value) {
        const uri = Schema.uri.create.file(ns, fileid);
        acc.push({ uri, ...value });
      }
      return acc;
    }, [] as t.IClientFileData[]);

    const res: T = { ok: true, status: 200, body };
    return res;
  }
}
