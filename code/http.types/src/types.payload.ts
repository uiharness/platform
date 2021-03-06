import { t, Json } from './common';

/**
 * Request
 */
export type IHttpRequestPayload = {
  url: string;
  method: t.HttpMethod;
  mode?: t.HttpCors;
  headers?: t.IHttpHeaders;
  data?: Record<string, unknown> | string;
};

/**
 * Response
 */
export type IHttpResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: t.IHttpHeaders;
  contentType: IHttpContentType;
  body?: ReadableStream<Uint8Array>;
  text: string;
  json: Json;
};

export type IHttpContentType = {
  mime: string;
  is: {
    json: boolean;
    text: boolean;
    binary: boolean;
  };
  toString(): string;
};

/**
 * Respond (method)
 */
export type IHttpRespondPayload = {
  status: number;
  statusText?: string;
  headers?: t.IHttpHeaders;
  data?: ReadableStream<Uint8Array> | Record<string, unknown> | string;
};
