import { joinPaths } from '@khulnasoft/utils-path';
import { FileFlag } from 'browserfs/dist/node/core/file_flag';
import { PromisifiedBrowserFS, ReadonlyPromisifiedBrowserFS } from '../../src/browserfs/types';
import { REPO_ROOT } from './constants';

export const readFile = async (fs: ReadonlyPromisifiedBrowserFS, path: string): Promise<string> => {
  // We are guaranteed for this to be "string" since we pass the utf-8
  return fs.readFile(path, 'utf-8', FileFlag.getFileFlag('r')).then(x => <string>x);
};

export const rmRepoFile = async (fs: PromisifiedBrowserFS, path: string): Promise<void> => {
  const fullPath = joinPaths('/', REPO_ROOT, path);
  const stat = await fs.stat(fullPath, false);

  if (stat.isDirectory()) {
    await fs.rmdir(fullPath);
  } else {
    await fs.unlink(fullPath);
  }
};

export const readRepoFile = async (
  fs: ReadonlyPromisifiedBrowserFS,
  path: string,
): Promise<string> => {
  return readFile(fs, joinPaths('/', REPO_ROOT, path));
};

export const writeRepoFile = async (
  fs: PromisifiedBrowserFS,
  path: string,
  content: string,
  mode: number = -1,
): Promise<void> => {
  // We are guaranteed for this to be "string" since we pass the utf-8
  return fs.writeFile(
    joinPaths('/', REPO_ROOT, path),
    content,
    'utf-8',
    FileFlag.getFileFlag('w'),
    mode,
  );
};

export const readAllFiles = async (
  fs: ReadonlyPromisifiedBrowserFS,
  path: string = '/',
): Promise<Record<string, string>> => {
  const stat = await fs.stat(path, false);

  if (stat.isFile()) {
    const content = await readFile(fs, path);

    return {
      [path]: content,
    };
  }

  // path is directory, lets recursively build result
  const result: Record<string, string> = {};
  const children = await fs.readdir(path);

  for (const child of children) {
    const childResult = await readAllFiles(fs, joinPaths(path, child));

    Object.assign(result, childResult);
  }

  return result;
};

export const readAllRepoFiles = async (fs: ReadonlyPromisifiedBrowserFS) =>
  readAllFiles(fs, joinPaths('/', REPO_ROOT));

export const statTime = async (fs: ReadonlyPromisifiedBrowserFS, path: string) => {
  const stat = await fs.stat(path, false);

  return {
    mtime: stat.mtime,
    atime: stat.atime,
    ctime: stat.ctime,
  };
};
