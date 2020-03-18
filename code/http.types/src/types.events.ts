import { t, IDuration } from './common';

export type HttpRespondInput =
  | t.IHttpRespondPayload
  | (() => t.IHttpRespondPayload)
  | (() => Promise<t.IHttpRespondPayload>);

/**
 * Events
 */
export type HttpEvent = IHttpBeforeEvent | IHttpAfterEvent;

export type IHttpBeforeEvent = { type: 'HTTP/before'; payload: IHttpBefore };
export type IHttpBefore = {
  uid: string;
  method: t.HttpMethod;
  url: string;
  data?: any;
  headers: t.IHttpHeaders;
  isModified: boolean;
  modify(args: { data?: any | Buffer; headers?: t.IHttpHeaders }): void;
  respond(payload: HttpRespondInput): void; // NB: Used for mocking/testing or providing alternative `fetch` implementations.
};

export type IHttpAfterEvent = { type: 'HTTP/after'; payload: IHttpAfter };
export type IHttpAfter = {
  uid: string;
  method: t.HttpMethod;
  url: string;
  response: t.IHttpResponse;
  elapsed: IDuration;
};