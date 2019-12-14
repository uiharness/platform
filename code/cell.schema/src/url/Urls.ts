import { R, t } from '../common';
import { Uri } from '../uri';
import { Url } from './Url';
import * as util from './util';
import { ROUTES } from './ROUTES';

/**
 * Standardised construction of URLs for the HTTP service.
 */
export class Urls {
  public static readonly uri = Uri;
  public static readonly routes = ROUTES;

  public static parse(input?: string) {
    input = (input || '').trim() || 'localhost';
    const host = R.pipe(util.stripHttp, util.stripSlash, util.stripPort)(input);
    const protocol = util.toProtocol(host);
    const port = util.toPort(input) || 80;
    const origin = port === 80 ? `${protocol}://${host}` : `${protocol}://${host}:${port}`;
    return { protocol, host, port, origin };
  }

  /**
   * [Lifecycle]
   */
  constructor(input?: string) {
    const { protocol, host, port, origin } = Urls.parse(input);
    this.host = host;
    this.protocol = protocol;
    this.port = port;
    this.origin = origin;
  }

  /**
   * [Fields]
   */

  public readonly protocol: t.HttpProtocol;
  public readonly host: string;
  public readonly port: number;
  public readonly origin: string;

  /**
   * [Properties]
   */

  public get sys() {
    const toPath = this.toUrl;
    return {
      get info() {
        return toPath('.sys');
      },
      get uid() {
        return toPath('.uid');
      },
    };
  }

  /**
   * [Methods]
   */

  public ns(id: string) {
    const toPath = this.toUrl;
    if (id.includes(':')) {
      const uri = Uri.parse(id);
      const type = uri.parts.type;

      if (uri.error) {
        throw new Error(uri.error.message);
      }

      if (type === 'ns') {
        id = (uri.parts as t.INsUri).id;
      } else if (type === 'CELL') {
        id = (uri.parts as t.ICellUri).ns;
      } else {
        const err = `The id for the namespace is a URI, but not of type "ns:" or "cell:" ("${id}")`;
        throw new Error(err);
      }
    }

    return {
      get info() {
        return toPath<t.IUrlQueryNs>(`/ns:${id}`);
      },
    };
  }

  public cell(uri: string) {
    const toPath = this.toUrl;
    const cell = Uri.parse<t.ICellUri>(uri);
    if (cell.error) {
      throw new Error(cell.error.message);
    }
    if (cell.parts.type !== 'CELL') {
      const err = `The given URI is not of type "cell:" ("${uri}")`;
      throw new Error(err);
    }
    const { ns, key } = cell.parts;

    return {
      get info() {
        type Q = t.IUrlQueryCell;
        return toPath<Q>(`/cell:${ns}!${key}`);
      },
      get files() {
        type Q = t.IUrlQueryCellFiles;
        return toPath<Q>(`/cell:${ns}!${key}/files`);
      },
      file: {
        byName(name: string) {
          type Q = t.IUrlQueryCellFile;
          name = (name || '').trim();
          if (!name) {
            throw new Error(`Filename not provided.`);
          }
          return toPath<Q>(`/cell:${ns}!${key}/file/${name}`);
        },
      },
    };
  }

  public file(uri: string) {
    const toPath = this.toUrl;
    const file = Uri.parse<t.IFileUri>(uri);
    if (file.error) {
      throw new Error(file.error.message);
    }
    if (file.parts.type !== 'FILE') {
      const err = `The given URI is not of type "file:" ("${uri}")`;
      throw new Error(err);
    }

    const { id } = file.parts;
    return {
      get download() {
        type Q = t.IUrlQueryGetFile;
        return toPath<Q>(`/file:${id}`);
      },
      get info() {
        type Q = t.IUrlQueryGetFileInfo;
        return toPath<Q>(`/file:${id}/info`);
      },
    };
  }

  /**
   * [Internal]
   */
  private toUrl = <Q extends object>(path: string, options: { query?: Q } = {}): t.IUrl<Q> => {
    const { query } = options;
    return new Url<Q>({ origin: this.origin, path, query });
  };
}
