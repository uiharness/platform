import { t } from '../common';

/**
 * POST: Execute Function(s).
 */
export type IReqQueryFuncRun = {
  pull?: boolean; //     Sets "pull" flag when not specified within body payload.
  silent?: boolean; //   Sets "silent" flag when not specified within body payload.
  timeout?: number; //   Sets "timeout" (msecs) when not specified within body payload.
};

export type IReqPostFuncRunBody = t.IReqPostFuncRun | t.IReqPostFuncRun[];

export type IReqPostFuncRun = {
  uri: string; // Cell URI
  host?: string; // NB: the running system's host is used if not specified.
  dir?: string;
  tx?: string; // Execution transaction ID (generated if not specified).
  params?: t.JsonMap;
  pull?: boolean; // Flag to force pull the bundle (if it's already cached.)
  silent?: boolean;
  timeout?: number; // Msecs.
};

export type IResPostFuncRun = {
  elapsed: t.RuntimeElapsed;
  results: t.IResPostFuncRunResult[];
};

export type IResPostFuncRunResult = {
  ok: boolean;
  tx: string; // Execution transaction ID.
  result?: t.JsonMap;
  elapsed: t.RuntimeElapsed;
  bundle: t.RuntimeBundleOrigin;
  cache: { exists: boolean; pulled: boolean };
  runtime: { name: t.RuntimeEnv['name']; version: string; silent: boolean };
  size: { bytes: number; files: number };
  urls: { files: string; manifest: string };
  errors: t.IRuntimeError[];
};

/**
 * TODO 🐷 (for chaining)
 *  Think about SmallTalk ("language of messages")
 *    - in
 *    - out
 */
