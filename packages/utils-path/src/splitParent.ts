import { PATH_SEPARATOR } from './constants';

export const splitParent = (path: string): [string | null, string] => {
  const idx = path.lastIndexOf(PATH_SEPARATOR);

  return [
    // parent
    idx >= 0 ? path.substring(0, idx) : null,
    // name
    idx >= 0 ? path.substring(idx + 1) : path,
  ];
};
