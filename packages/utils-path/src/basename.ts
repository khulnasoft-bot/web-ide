import { cleanEndingSeparator } from './cleanEndingSeparator';
import { PATH_ROOT } from './constants';
import { splitParent } from './splitParent';

export const basename = (pathArg: string) => {
  const [, name] = splitParent(cleanEndingSeparator(pathArg));

  return name || PATH_ROOT;
};
