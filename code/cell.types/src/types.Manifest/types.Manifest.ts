import { t } from '../common';

export type Manifest<
  F extends t.ManifestFile = t.ManifestFile,
  H extends ManifestHash = ManifestHash,
> = {
  hash: H;
  files: F[];
};

export type ManifestHash = {
  files: string; // The hash of all [filehash] values in the manifest [files] list.
};
