import { cleanEndingSeparator } from './cleanEndingSeparator';
import { cleanLeadingSeparator } from './cleanLeadingSeparator';
import { PATH_SEPARATOR } from './constants';

// TODO: improve this
/**
 * Safely joins the given paths which might both start and end with a `/`
 *
 * Example:
 * - `joinPaths('abc/', '/def') === 'abc/def'`
 * - `joinPaths(null, 'abc/def', 'zoo) === 'abc/def/zoo'`
 *
 * @param  {...String} paths
 * @returns {String}
 */
export function joinPaths(...paths: string[]): string {
  return paths.reduce((acc, path) => {
    if (!path) {
      return acc;
    }
    if (!acc) {
      return path;
    }

    return [cleanEndingSeparator(acc), PATH_SEPARATOR, cleanLeadingSeparator(path)].join('');
  }, '');
}
