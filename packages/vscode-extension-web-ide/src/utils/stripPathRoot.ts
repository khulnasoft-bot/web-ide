import { cleanLeadingSeparator, joinPaths } from '@khulnasoft/utils-path';

export const stripPathRoot = (path: string, root: string) => {
  const cleanPath = cleanLeadingSeparator(path);
  const cleanRoot = joinPaths(cleanLeadingSeparator(root), '/');

  if (cleanPath.startsWith(cleanRoot)) {
    return cleanPath.substring(cleanRoot.length);
  }

  return path;
};
