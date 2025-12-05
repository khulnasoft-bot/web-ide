import { PATH_SEPARATOR_LEADING_REGEX } from './constants';

export function cleanLeadingSeparator(path: string): string {
  return path.replace(PATH_SEPARATOR_LEADING_REGEX, '');
}
