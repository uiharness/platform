import { t } from '../../common';

export type CreateAndSave = (args: CreateAndSaveArgs) => Promise<CreateAndSaveResponse>;
export type CreateAndSaveResponse = { path: string; manifest: t.TypelibManifest };
export type CreateAndSaveArgs = {
  base: string;
  dir: string;
  filename?: string; // Default: "index.json"
  model?: t.CompilerModel;
  info?: t.TypelibManifestInfo;
};

export type Dirs = { base: string; dirname: string; join(): string };
