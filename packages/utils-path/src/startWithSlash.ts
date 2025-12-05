import { PATH_SEPARATOR } from './constants';

export const startWithSlash = (path: string): string =>
  path[0] === PATH_SEPARATOR ? path : `${PATH_SEPARATOR}${path}`;
