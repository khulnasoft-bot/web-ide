import { sha256, urlSafeBase64 } from '@gitlab/utils-crypto';

export const sha256ForUrl = (str: string) => {
  const input = new TextEncoder().encode(str);
  const hashed = sha256(input);

  return urlSafeBase64(hashed).replace(/=/g, '');
};
