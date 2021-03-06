/* eslint-disable @typescript-eslint/no-unused-vars */

import { routes, t, util } from '../common';
import { deleteCellFiles } from './handler.delete';
import { listCellFiles } from './handler.list';
import { uploadCellFilesComplete } from './handler.upload.complete';
import { uploadCellFilesStart } from './handler.upload.start';
import { copyCellFiles } from './handler.copy';
import { getParams } from './params';

const { FILES, FILE } = routes.CELL.FS;

/**
 * Routes for operating on a set of cell files.
 */
export function init(args: { db: t.IDb; fs: t.IFileSystem; router: t.IRouter }) {
  const { db, fs, router } = args;

  /**
   * GET: cell:foo:A1/fs
   */
  router.get(FILES.BASE, async (req) => {
    try {
      const host = req.host;
      const query = req.query as t.IReqQueryCellFsList;
      const params = req.params as t.IUrlParamsCellFs;
      const paramData = getParams({ params });
      const { status, error, cellUri } = paramData;
      const { expires, files: includeFiles, urls: includeUrls, filter } = query;

      return !paramData.ns || error
        ? { status, data: { error } }
        : listCellFiles({ host, db, fs, cellUri, expires, includeFiles, includeUrls, filter });
    } catch (err) {
      return util.toErrorPayload(err);
    }
  });

  /**
   * POST upload start.
   *
   *      Initiate a file(s) upload, creating the model and
   *      returning pre-signed S3 url(s) to upload to.
   *
   *      Usage sequence for clients:
   *        1. POST (here) to initiate the upload by saving the model. This:
   *           - Prepares the cell model with the new link-refs to the files
   *           - POSTs to the "upload start" handler for each file which generates
   *             an upload link (either "pre-signed S3 URL" or the local file-system endpoint)
   *        2. POST the file binary to the given upload link(s).
   *        3. POST to the "upload complete" endpoint for each uploaded file to capture its meta-data and verify its state.
   *        4. POST to the "upload complete" endpoint for the cell.
   */
  router.post(FILES.UPLOAD, async (req) => {
    try {
      const host = req.host;
      const query = req.query as t.IReqQueryCellFsUpload;
      const params = req.params as t.IUrlParamsCellFs;
      const paramData = getParams({ params });
      const { status, error, cellUri } = paramData;
      const changes = query.changes;
      const body = ((await req.body.json()) || {}) as t.IReqPostCellFsUploadStartBody;

      return !paramData.ns || error
        ? { status, data: { error } }
        : uploadCellFilesStart({ db, fs, cellUri, body, host, changes });
    } catch (err) {
      return util.toErrorPayload(err);
    }
  });

  /**
   * POST upload complete.
   *
   *      Complete the file(s) upload by updating the model
   *      and running any validation which is necessary.
   *
   */
  router.post(FILES.UPLOADED, async (req) => {
    try {
      const host = req.host;
      const query = req.query as t.IReqQueryCellFsUploaded;
      const params = req.params as t.IUrlParamsCellFs;
      const paramData = getParams({ params });
      const { status, error, cellUri } = paramData;
      const changes = query.changes;
      const body = ((await req.body.json()) || {}) as t.IReqPostCellFsUploadCompleteBody;

      return !paramData.ns || error
        ? { status, data: { error } }
        : uploadCellFilesComplete({ db, fs, cellUri, body, host, changes });
    } catch (err) {
      return util.toErrorPayload(err);
    }
  });

  /**
   * DELETE file(s) from a cell.
   */
  router.delete(FILES.BASE, async (req) => {
    try {
      const host = req.host;
      const query = req.query as t.IReqQueryCellFsDelete;
      const params = req.params as t.IUrlParamsCellFs;
      const paramData = getParams({ params });
      const body = (await req.body.json()) as t.IReqDeleteCellFsBody;
      const { status, error, cellUri: cellUri } = paramData;

      return !paramData.ns || error
        ? { status, data: { error } }
        : deleteCellFiles({ db, fs, cellUri, body, host });
    } catch (err) {
      return util.toErrorPayload(err);
    }
  });

  /**
   * POST copy file(s) between cells.
   */
  router.post(FILES.COPY, async (req) => {
    try {
      const host = req.host;
      const query = req.query as t.IReqQueryCellFsCopy;
      const params = req.params as t.IUrlParamsCellFs;
      const paramData = getParams({ params });
      const body = (await req.body.json()) as t.IReqPostCellFsCopyBody;
      const changes = query.changes;
      const permission = query['s3:permission'];
      const { status, error, cellUri: cellUri } = paramData;

      return !paramData.ns || error
        ? { status, data: { error } }
        : copyCellFiles({ db, fs, cellUri, body, host, changes, permission });
    } catch (err) {
      return util.toErrorPayload(err);
    }
  });
}
