import { splitParent } from '@gitlab/utils-path';

const addAllParentPathsToSet = (pathsSet: Set<string>, path: string) => {
  if (!path || pathsSet.has(path)) {
    return;
  }

  pathsSet.add(path);

  const [parent] = splitParent(path);

  if (parent) {
    addAllParentPathsToSet(pathsSet, parent);
  }
};

/**
 * This method creates a set from all the given paths *and* their parent paths.
 *
 * @param paths List of all initial paths to traverse for parent paths
 * @returns Set of all paths and parent paths
 */
export const createSetOfAllPaths = (paths: string[]): ReadonlySet<string> => {
  const pathsSet = new Set<string>();

  paths.forEach(path => {
    addAllParentPathsToSet(pathsSet, path);
  });

  return pathsSet;
};
