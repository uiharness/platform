import { t } from '../common';
import { ICellUri, INsUri } from '../types.Schema';

type Duration = string; // Parsable duration, eg "1h", "5m" etc. Max: "1h".

/**
 * Response.
 */
export type HttpClientBodyType = 'JSON' | 'TEXT' | 'BINARY';
export type IHttpClientAsync<T> = Promise<IHttpClientResponse<T>>;
export type IHttpClientResponse<T> = {
  ok: boolean;
  status: number;
  body: T;
  bodyType: HttpClientBodyType;
  error?: t.IHttpError;
};

/**
 * Static interface
 */
export type HttpClient = {
  create(input?: string | number | t.IHttpClientOptions): t.IHttpClient;
  isClient(input?: any): boolean;
  isReachable(host: string): Promise<boolean>;
};

/**
 * Client (Root)
 */
export type IHttpClient = {
  readonly origin: string;
  request$: t.Observable<t.IHttpBefore>;
  response$: t.Observable<t.IHttpAfter>;

  info<T extends t.IResGetSysInfo>(): t.IHttpClientAsync<T>;
  ns(input: string | t.INsUri | t.ICoordUri | t.IFileUri): IHttpClientNs;
  cell(input: string | t.ICellUri): IHttpClientCell;
  file(input: string | t.IFileUri): IHttpClientFile;
};

export type IHttpClientOptions = { host?: string | number; http?: t.IHttp };

/**
 * Namespace
 */
export type IHttpClientNs = {
  readonly uri: t.INsUri;
  readonly url: t.IUrlsNs;
  exists(): Promise<boolean>;
  read(options?: t.IReqQueryNsInfo): t.IHttpClientAsync<t.IResGetNs>;
  write(data: t.IReqPostNsBody, options?: t.IReqQueryNsWrite): t.IHttpClientAsync<t.IResPostNs>;
};

/**
 * Cell
 */
export type IHttpClientCell = {
  readonly uri: t.ICellUri;
  readonly url: t.IUrlsCell;
  readonly file: IHttpClientCellFile;
  readonly fs: IHttpClientCellFs;
  exists(): Promise<boolean>;
  info(options?: t.IReqQueryCellInfo): t.IHttpClientAsync<t.IResGetCell>;
  links(): t.IHttpClientAsync<IHttpClientCellLinks>;
};

export type IHttpClientCellLinks = {
  toObject(): t.ICellData['links'];
  readonly list: IHttpClientCellLink[];
  readonly files: IHttpClientCellLinkFile[];
  readonly cells: IHttpClientCellLinkCell[];
  readonly namespaces: IHttpClientCellLinkNs[];
};

/**
 * Cell File
 */
export type IHttpClientCellFile = {
  name(path: string): IHttpClientCellFileByName;
};

export type IHttpClientCellFileByName = {
  exists(): Promise<boolean>;
  info(): t.IHttpClientAsync<t.IResGetFile>;
  download(options?: { expires?: Duration }): t.IHttpClientAsync<ReadableStream | t.Json | string>;
};

export type IHttpClientCellFs = {
  urls(): t.IHttpClientAsync<IHttpClientCellFileUrl[]>;
  map(): t.IHttpClientAsync<t.IFileMap>;
  list(options?: { filter?: string }): t.IHttpClientAsync<IHttpClientFileData[]>;
  upload(
    files: IHttpClientCellFileUpload | IHttpClientCellFileUpload[],
    options?: IHttpClientCellFsUploadOptions,
  ): IHttpClientCellFsUploadPromise;
  delete(filename: string | string[]): t.IHttpClientAsync<t.IResDeleteCellFsData>;
  unlink(filename: string | string[]): t.IHttpClientAsync<t.IResDeleteCellFsData>;
  copy(
    files: t.IHttpClientCellFileCopy | t.IHttpClientCellFileCopy[],
    options?: IHttpClientCellFsCopyOptions,
  ): t.IHttpClientAsync<t.IResPostCellFsCopyData>;
};

export type IHttpClientCellFsUploadOptions = {
  changes?: boolean;
  permission?: t.FsS3Permission;
};

export type IHttpClientCellFsUploadPromise =
  t.IHttpClientAsync<IHttpClientCellFileUploadResponse> & {
    event$: t.Observable<t.IHttpClientUploadedEvent>;
  };

export type IHttpClientCellFsCopyOptions = {
  changes?: boolean;
  permission?: t.FsS3Permission;
};

export type IHttpClientCellFileUrl = {
  uri: string;
  url: string;
  path: string;
  filename: string;
  dir: string;
};

export type IHttpClientCellFileUpload = {
  filename: string;
  data: ArrayBuffer;
  mimetype?: string;
  allowRedirect?: boolean; // Default: true
  's3:permission'?: t.FsS3Permission;
};
export type IHttpClientCellFileUploadResponse = {
  uri: string;
  cell: t.ICellData;
  files: t.IUriData<t.IFileData>[];
  errors: t.IHttpErrorFile[];
  changes?: t.IDbModelChange[];
};

export type IHttpClientCellFileCopy = {
  filename: string; // Source file on cell.
  target: IHttpClientCellFileCopyTarget;
};

export type IHttpClientCellFileCopyTarget = {
  uri: string; //       Cell URI
  host?: string; //     NB: Same as source if ommitted.
  filename?: string; // NB: Same as source if ommitted.
};

/**
 * Cell Links
 */
export type IHttpClientCellLink =
  | IHttpClientCellLinkUnknown
  | IHttpClientCellLinkFile
  | IHttpClientCellLinkCell
  | IHttpClientCellLinkNs;

export type IHttpClientCellLinkUnknown = {
  type: 'UNKNOWN';
  key: string;
  value: string;
};

export type IHttpClientCellLinkFile = {
  type: 'FILE';
  key: string;
  value: string;
  uri: t.IFileUri;
  path: string;
  dir: string;
  name: string;
  hash: string;
  client: IHttpClientFile;
};

export type IHttpClientCellLinkCell = {
  type: 'CELL';
  key: string;
  value: string;
  uri: ICellUri;
  client: IHttpClientCell;
};

export type IHttpClientCellLinkNs = {
  type: 'NS';
  key: string;
  value: string;
  uri: INsUri;
  client: IHttpClientNs;
};

/**
 * File
 */
export type IHttpClientFile = {
  readonly uri: t.IFileUri;
  readonly url: t.IUrlsFile;
  info(): t.IHttpClientAsync<t.IResGetFile>;
};

export type IHttpClientFileData = t.IFileData & {
  uri: string;
  filename: string;
  dir: string;
  path: string;
};
