import { joinPaths } from '@gitlab/utils-path';
import { Uri } from 'vscode';
import { SCM_SCHEME } from '../constants';

export interface WebIdeScmUriParams {
  path: string;
  ref: string;
}
export function fromScmUriToParams(uri: Uri): WebIdeScmUriParams {
  try {
    return JSON.parse(uri.query);
  } catch {
    return {
      path: uri.path,
      ref: '',
    };
  }
}

export const fromPathToScmUri = (filePath: string, repoRoot = ''): Uri =>
  Uri.from({
    scheme: SCM_SCHEME,
    path: joinPaths('/', repoRoot, filePath),
  });

export function fromUriToScmUri(uri: Uri, ref: string): Uri {
  // These need to be absolute paths
  const fullPath = joinPaths('/', uri.path);

  const params: WebIdeScmUriParams = {
    path: fullPath,
    ref,
  };

  const result = uri.with({
    scheme: SCM_SCHEME,
    path: fullPath,
    query: JSON.stringify(params),
  });

  return result;
}
