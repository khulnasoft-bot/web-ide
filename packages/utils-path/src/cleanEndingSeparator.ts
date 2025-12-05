import { PATH_SEPARATOR_ENDING_REGEX } from './constants';

export function cleanEndingSeparator(path: string): string {
  return path.replace(PATH_SEPARATOR_ENDING_REGEX, '');
}
