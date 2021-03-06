import { expect, expectError } from '@platform/test';
import { fs, Schema } from '../common';

export { expect, expectError };

export const expectFileInFs = async (fileUri: string, exists: boolean) => {
  const { file, ns } = Schema.Uri.file(fileUri);
  const path = fs.resolve(`tmp/fs/ns.${ns}/${file}`);
  expect(await fs.pathExists(path)).to.eql(exists);
};
