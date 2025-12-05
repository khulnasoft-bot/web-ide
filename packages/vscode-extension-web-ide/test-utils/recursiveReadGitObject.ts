import { Git } from '../src/git/Git';
import { GitObjectType, GitTreeOrBlobObject } from '../src/git/types';

export const recursiveReadGitObject = (git: Git, ref: string): GitTreeOrBlobObject => {
  const obj = git.readObject(ref);

  if (!obj) {
    throw new Error(`Could not find object for ref: ${ref}`);
  }

  if (obj.type === GitObjectType.BLOB) {
    return obj;
  }

  const readChildren = obj.data.children.map(({ key, name, type }) => ({
    key,
    name,
    type,
    data: recursiveReadGitObject(git, key).data,
  }));

  return {
    ...obj,
    data: {
      ...obj.data,
      children: readChildren,
    },
  };
};
