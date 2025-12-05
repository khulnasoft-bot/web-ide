import { cleanEndingSeparator } from './cleanEndingSeparator';
import { PATH_ROOT } from './constants';
import { splitParent } from './splitParent';

export const dirname = (pathArg: string) => {
  const [parent] = splitParent(cleanEndingSeparator(pathArg));

  return parent || PATH_ROOT;
};
